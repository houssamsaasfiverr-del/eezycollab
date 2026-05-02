export interface UserSmtpConfig {
  configured: boolean;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
  updatedAt: string | null;
}

export interface SaveUserSmtpConfigInput {
  userId: string;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
}

function ensureJsonResponse(response: Response, routeLabel: string) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`API route ${routeLabel} is not running. If running locally, please use vercel dev.`);
  }
}

export async function fetchUserSmtpConfig(userId: string): Promise<UserSmtpConfig> {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`/api/user-smtp-config?${params.toString()}`);
  ensureJsonResponse(response, '/api/user-smtp-config');

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load SMTP configuration');
  }

  return payload as UserSmtpConfig;
}

export async function saveUserSmtpConfig(input: SaveUserSmtpConfigInput): Promise<{ success: boolean; enabled: boolean; configured: boolean; hasPassword: boolean }> {
  const response = await fetch('/api/user-smtp-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  ensureJsonResponse(response, '/api/user-smtp-config');

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to save SMTP configuration');
  }

  return payload as { success: boolean; enabled: boolean; configured: boolean; hasPassword: boolean };
}
