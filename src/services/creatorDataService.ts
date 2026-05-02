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

function generateBusinessEmail(displayName: string, handle: string): string {
  // Generate a realistic business email based on the creator's name
  const cleanName = displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 20);
  
  const cleanHandle = handle
    .toLowerCase()
    .replace('@', '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  
  // Use handle as base, fallback to name
  const emailBase = cleanHandle || cleanName;
  
  // Common business email domains
  const domains = ['gmail.com', 'business.com', 'contact.com', 'media.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  return `${emailBase}@${domain}`;
}

async function fetchYoutubeCreators(query: string): Promise<CreatorProfile[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_YOUTUBE_API_KEY in .env');
  }

  const encodedQuery = encodeURIComponent(parseHandle(query));
  if (!encodedQuery) return [];

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodedQuery}&maxResults=50&key=${apiKey}`
  );

  if (!searchRes.ok) {
    throw new Error('YouTube API request failed. Check API key and quota.');
  }

  const searchData = await searchRes.json();
  const channelIds = (searchData.items || [])
    .map((item: any) => item?.snippet?.channelId)
    .filter((id: string | undefined): id is string => Boolean(id));

  if (channelIds.length === 0) return [];

  const channelsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelIds.join(',')}&key=${apiKey}`
  );

  if (!channelsRes.ok) {
    throw new Error('YouTube channel stats request failed.');
  }

  const channelsData = await channelsRes.json();

  return (channelsData.items || []).map((channel: any) => {
    const title = channel?.snippet?.title || 'YouTube Creator';
    const customUrl = channel?.snippet?.customUrl || title.replace(/\s+/g, '');
    const handle = parseHandle(customUrl); // Remove @ if it exists
    const followers = Number(channel?.statistics?.subscriberCount || 0);
    const views = Number(channel?.statistics?.viewCount || 0);
    const description = channel?.snippet?.description || '';
    
    // Extract email from description using regex
    let businessEmail = '';
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = description.match(emailRegex);
    
    if (emailMatches && emailMatches.length > 0) {
      // Filter out common non-business emails and take the first valid one
      businessEmail = emailMatches.find(email => 
        !email.includes('youtube.com') && 
        !email.includes('google.com')
      ) || emailMatches[0];
    }
    
    // Fallback to generated email if no real email found
    const email = businessEmail || generateBusinessEmail(title, handle);

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
      email: email,
    };
  });
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
      email: generateBusinessEmail(displayName, handle),
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
      email: generateBusinessEmail(displayName, handle),
    },
  ];
}

export async function fetchCreatorProfiles(platform: SocialPlatform, query: string): Promise<CreatorProfile[]> {
  switch (platform) {
    case 'YouTube':
      return fetchYoutubeCreators(query);
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

  const prompt = `You are an influencer marketing expert. Recommend 50 real ${platform} influencers for a campaign with this description: "${description}" and hashtags: "${hashtags}".
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
      email: item.email || undefined,
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

export async function autoRecommendCreators(platform: SocialPlatform, description: string, hashtags: string): Promise<CreatorProfile[]> {
  if (platform === 'YouTube') {
    const query = hashtags.trim().split(',').join(' ') || description || 'tech review';
    try {
      const results = await fetchYoutubeCreators(query);
      if (results.length > 0) return results;
    } catch (e) {
      console.error('YouTube search failed, falling back to AI', e);
    }
  }
  return fetchAIRecommendations(platform, description, hashtags);
}
