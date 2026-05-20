import { GoogleGenerativeAI } from '@google/generative-ai';

export type SocialPlatform = 'YouTube' | 'Instagram' | 'TikTok' | 'Facebook';

export interface CreatorProfile {
  id: string;
  platform: SocialPlatform;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
  followers?: number;
  views?: number;
  engagementRate?: number;
  email?: string;
}

type YoutubeSearchOptions = {
  regionCode?: string;
  countryCode?: string;
  relevanceLanguage?: string;
  requireNonTitleMatch?: boolean;
};

function parseHandle(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) return trimmed.slice(1);
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').filter(Boolean);
    return (parts[parts.length - 1] || '').replace('@', '');
  }
  return trimmed;
}

function formatNumber(value?: number): string {
  if (!value || Number.isNaN(value)) return 'N/A';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function extractRealEmail(...sources: Array<string | undefined>): string | undefined {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  for (const source of sources) {
    if (!source) continue;

    const matches = source.match(emailRegex);
    if (!matches || matches.length === 0) continue;

    const exactEmail = matches.find(
      (email) => !email.includes('youtube.com') && !email.includes('google.com'),
    );

    if (exactEmail) {
      return exactEmail.toLowerCase();
    }
  }

  return undefined;
}

async function fetchYoutubeCreators(
  query: string,
  options: YoutubeSearchOptions = {},
): Promise<CreatorProfile[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_YOUTUBE_API_KEY in .env');
  }

  const trimmedQuery = query.trim();
  const encodedQuery = encodeURIComponent(parseHandle(trimmedQuery));
  if (!encodedQuery) return [];

  const channelIdSet = new Set<string>();
  const maxPagesToFetch = 8;
  let pageToken: string | undefined;

  for (let page = 0; page < maxPagesToFetch; page += 1) {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'channel',
      q: parseHandle(trimmedQuery),
      maxResults: '50',
      key: apiKey,
    });

    if (options.regionCode) {
      searchParams.set('regionCode', options.regionCode.toUpperCase());
    }

    if (options.relevanceLanguage) {
      searchParams.set('relevanceLanguage', options.relevanceLanguage);
    }

    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
    );

    if (!searchRes.ok) {
      throw new Error('YouTube API request failed. Check API key and quota.');
    }

    const searchData = await searchRes.json();
    (searchData.items || [])
      .map((item: any) => item?.snippet?.channelId)
      .filter((id: string | undefined): id is string => Boolean(id))
      .forEach((id: string) => channelIdSet.add(id));

    pageToken = searchData.nextPageToken;
    if (!pageToken) break;
  }

  const channelIds = Array.from(channelIdSet);

  if (channelIds.length === 0) return [];

  const channelsDataItems: any[] = [];
  for (let index = 0; index < channelIds.length; index += 50) {
    const batchIds = channelIds.slice(index, index + 50);
    const channelsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${batchIds.join(',')}&key=${apiKey}`,
    );

    if (!channelsRes.ok) {
      throw new Error('YouTube channel stats request failed.');
    }

    const channelsData = await channelsRes.json();
    channelsDataItems.push(...(channelsData.items || []));
  }

  const queryTokens = trimmedQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const normalizedCountry = options.countryCode?.toUpperCase();

  return channelsDataItems
    .map((channel: any) => {
    const title = channel?.snippet?.title || 'YouTube Creator';
    const customUrl = channel?.snippet?.customUrl || title.replace(/\s+/g, '');
    const handle = parseHandle(customUrl); // Remove @ if it exists
    const followers = Number(channel?.statistics?.subscriberCount || 0);
    const views = Number(channel?.statistics?.viewCount || 0);
    const description = channel?.snippet?.description || '';
    const keywordText = String(
      channel?.brandingSettings?.channel?.keywords || '',
    );
    const channelCountry = String(
      channel?.brandingSettings?.channel?.country || '',
    ).toUpperCase();
    const email = extractRealEmail(description, keywordText, title, customUrl);

    if (normalizedCountry) {
      if (!channelCountry || channelCountry !== normalizedCountry) {
        return null;
      }
    }

    if (options.requireNonTitleMatch && queryTokens.length > 0) {
      const descriptionMatch = queryTokens.some((token) =>
        description.toLowerCase().includes(token),
      );
      const keywordMatch = queryTokens.some((token) =>
        keywordText.toLowerCase().includes(token),
      );

      if (!descriptionMatch && !keywordMatch) {
        return null;
      }
    }
    
    return {
      id: channel.id,
      platform: 'YouTube' as const,
      handle: `@${handle}`, // Add single @
      displayName: title,
      bio: description,
      avatarUrl: channel?.snippet?.thumbnails?.default?.url,
      profileUrl: `https://www.youtube.com/channel/${channel.id}`,
      followers,
      views,
      engagementRate: views > 0 && followers > 0 ? Number(((followers / views) * 100).toFixed(2)) : undefined,
      email,
    };
    })
    .filter((profile: CreatorProfile | null): profile is CreatorProfile =>
      Boolean(profile),
    );
}

async function fetchTikTokCreator(query: string): Promise<CreatorProfile[]> {
  const input = query.trim();
  if (!input) return [];

  // TikTok oEmbed needs a full video/profile URL.
  const url = input.startsWith('http') ? input : `https://www.tiktok.com/@${parseHandle(input)}`;
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);

  if (!res.ok) {
    throw new Error('TikTok data unavailable. Use a valid TikTok URL (profile or video).');
  }

  const data = await res.json();
  const handle = parseHandle(String(data.author_url || data.author_name || input));
  const displayName = data.author_name || `@${handle}`;

  return [
    {
      id: `tiktok-${handle}`,
      platform: 'TikTok',
      handle: `@${handle}`,
      displayName: displayName,
      bio: data.title || 'TikTok creator profile',
      avatarUrl: data.thumbnail_url,
      profileUrl: data.author_url || url,
    },
  ];
}

async function fetchInstagramCreator(query: string): Promise<CreatorProfile[]> {
  const appAccessToken = import.meta.env.VITE_INSTAGRAM_APP_ACCESS_TOKEN;
  if (!appAccessToken) {
    throw new Error('Missing VITE_INSTAGRAM_APP_ACCESS_TOKEN in .env');
  }

  const input = query.trim();
  if (!input) return [];

  const url = input.startsWith('http') ? input : `https://www.instagram.com/${parseHandle(input)}/`;
  const endpoint = `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(appAccessToken)}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error('Instagram data unavailable. Ensure oEmbed token is valid and URL is public.');
  }

  const data = await res.json();
  const handle = parseHandle(String(data.author_name || input));
  const displayName = data.author_name || `@${handle}`;

  return [
    {
      id: `instagram-${handle}`,
      platform: 'Instagram',
      handle: `@${handle}`,
      displayName: displayName,
      bio: data.title || 'Instagram creator profile',
      profileUrl: url,
    },
  ];
}

export async function fetchCreatorProfiles(
  platform: SocialPlatform,
  query: string,
  options: YoutubeSearchOptions = {},
): Promise<CreatorProfile[]> {
  switch (platform) {
    case 'YouTube':
      return fetchYoutubeCreators(query, options);
    case 'TikTok':
      return fetchTikTokCreator(query);
    case 'Instagram':
      return fetchInstagramCreator(query);
    case 'Facebook':
      return [];
    default:
      return [];
  }
}

export function profileMeta(profile: CreatorProfile): string {
  const followers = formatNumber(profile.followers);
  const views = formatNumber(profile.views);

  if (profile.platform === 'YouTube') {
    return `${followers} subscribers • ${views} views`;
  }

  return followers !== 'N/A' ? `${followers} followers` : 'Public profile data';
}

export async function fetchAIRecommendations(platform: SocialPlatform, description: string, hashtags: string): Promise<CreatorProfile[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return [];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an influencer marketing expert. Recommend 150 real ${platform} influencers for a campaign with this description: "${description}" and hashtags: "${hashtags}".
Return ONLY a valid JSON array of objects with these keys: "handle" (e.g. "@username"), "displayName", "bio" (short 1-sentence description), "followers" (estimated number), "email" (business email if available, format: name@domain.com). Do not include markdown formatting or backticks.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);

    return data.map((item: any, index: number) => ({
      id: `ai-rec-${index}-${Date.now()}`,
      platform: platform,
      handle: item.handle,
      displayName: item.displayName || item.handle,
      bio: item.bio,
      followers: typeof item.followers === 'number' ? item.followers : parseInt(String(item.followers).replace(/[^0-9]/g, '')) || 0,
      email: extractRealEmail(String(item.email || '')),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName || item.handle)}&background=random&color=fff&size=150`,
      profileUrl: platform === 'YouTube' ? `https://youtube.com/${item.handle}` :
                  platform === 'TikTok' ? `https://tiktok.com/${item.handle}` :
                  platform === 'Facebook' ? `https://facebook.com/${String(item.handle).replace('@', '')}` :
                  `https://instagram.com/${String(item.handle).replace('@', '')}`
    }));
  } catch (error) {
    console.error('AI recommendation error:', error);
    return [];
  }
}

type AutoRecommendOptions = {
  language?: string;
  regions?: string[];
};

function toYouTubeLanguageCode(language?: string): string | undefined {
  if (!language) return undefined;

  const normalized = language.trim().toLowerCase();
  const languageMap: Record<string, string> = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
    arabic: 'ar',
    hindi: 'hi',
    japanese: 'ja',
    korean: 'ko',
    chinese: 'zh',
    dutch: 'nl',
    turkish: 'tr',
    russian: 'ru',
  };

  return languageMap[normalized] || normalized.slice(0, 2);
}

function buildRegionalQuery(description: string, hashtags: string, regions: string[] = [], language?: string): string {
  const parts = [description.trim(), hashtags.trim()];

  if (regions.length > 0) {
    parts.push(`regions: ${regions.join(', ')}`);
  }

  if (language?.trim()) {
    parts.push(`language: ${language.trim()}`);
  }

  return parts.filter(Boolean).join(' ').trim();
}

export async function autoRecommendCreators(
  platform: SocialPlatform,
  description: string,
  hashtags: string,
  options: AutoRecommendOptions = {},
): Promise<CreatorProfile[]> {
  const aiResults = await fetchAIRecommendations(
    platform,
    buildRegionalQuery(description, hashtags, options.regions, options.language),
    hashtags,
  );

  if (platform === 'YouTube') {
    const query = [description.trim(), hashtags.trim()]
      .filter(Boolean)
      .join(' ') || 'tech review';
    try {
      const results = await fetchYoutubeCreators(query, {
        relevanceLanguage: toYouTubeLanguageCode(options.language),
        requireNonTitleMatch: true,
      });
      if (results.length >= 150) return results;

      const merged = [...results];
      const seenHandles = new Set(
        merged.map((profile) => profile.handle.toLowerCase()),
      );
      for (const profile of aiResults) {
        if (seenHandles.has(profile.handle.toLowerCase())) continue;
        merged.push(profile);
        seenHandles.add(profile.handle.toLowerCase());
        if (merged.length >= 150) break;
      }

      if (merged.length > 0) return merged;
    } catch (e) {
      console.error('YouTube search failed, falling back to AI', e);
    }
  }
  return aiResults;
}
