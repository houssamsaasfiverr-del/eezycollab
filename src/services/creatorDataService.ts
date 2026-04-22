export type SocialPlatform = 'YouTube' | 'Instagram' | 'TikTok';

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

async function fetchYoutubeCreators(query: string): Promise<CreatorProfile[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_YOUTUBE_API_KEY in .env');
  }

  const encodedQuery = encodeURIComponent(parseHandle(query));
  if (!encodedQuery) return [];

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodedQuery}&maxResults=8&key=${apiKey}`
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
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${apiKey}`
  );

  if (!channelsRes.ok) {
    throw new Error('YouTube channel stats request failed.');
  }

  const channelsData = await channelsRes.json();

  return (channelsData.items || []).map((channel: any) => {
    const title = channel?.snippet?.title || 'YouTube Creator';
    const handle = channel?.snippet?.customUrl ? `@${channel.snippet.customUrl}` : `@${title.replace(/\s+/g, '')}`;
    const followers = Number(channel?.statistics?.subscriberCount || 0);
    const views = Number(channel?.statistics?.viewCount || 0);

    return {
      id: channel.id,
      platform: 'YouTube' as const,
      handle,
      displayName: title,
      bio: channel?.snippet?.description || '',
      avatarUrl: channel?.snippet?.thumbnails?.default?.url,
      profileUrl: `https://www.youtube.com/channel/${channel.id}`,
      followers,
      views,
      engagementRate: views > 0 && followers > 0 ? Number(((followers / views) * 100).toFixed(2)) : undefined,
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

  return [
    {
      id: `tiktok-${handle}`,
      platform: 'TikTok',
      handle: `@${handle}`,
      displayName: data.author_name || `@${handle}`,
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

  return [
    {
      id: `instagram-${handle}`,
      platform: 'Instagram',
      handle: `@${handle}`,
      displayName: data.author_name || `@${handle}`,
      bio: data.title || 'Instagram creator profile',
      profileUrl: url,
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
