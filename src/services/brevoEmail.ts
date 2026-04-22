export interface CampaignRecipient {
  email: string;
  name?: string;
}

export interface SendBulkEmailOptions {
  userId: string;
  projectId?: string | null;
  senderEmail?: string;
  senderName?: string;
  subject: string;
  messageTemplate: string;
  recipients: CampaignRecipient[];
}

export interface CampaignEmailLog {
  id: string;
  user_id: string;
  project_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  sender_email: string | null;
  subject: string | null;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function sendBulkEmails(options: SendBulkEmailOptions) {
  const response = await fetch('/api/brevo-send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to send campaign emails');
  }

  return payload as {
    sentCount: number;
    failedCount: number;
    total: number;
    results: Array<{
      email: string;
      name?: string;
      status: 'sent' | 'failed';
      providerMessageId: string | null;
      error: string | null;
    }>;
  };
}

export async function fetchCampaignInbox(userId: string, projectId?: string | null) {
  const params = new URLSearchParams({ userId });
  if (projectId) {
    params.set('projectId', projectId);
  }

  const response = await fetch(`/api/brevo-inbox?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load campaign inbox');
  }

  return (payload?.emails || []) as CampaignEmailLog[];
}

export function parseRecipientList(input: string): CampaignRecipient[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const namedMatch = line.match(/^(.*?)\s*<([^>]+)>$/);
      if (namedMatch) {
        return {
          name: namedMatch[1].trim(),
          email: namedMatch[2].trim().toLowerCase()
        };
      }

      const parts = line.split(/\s+/).filter(Boolean);
      const emailPart = parts.find((part) => part.includes('@')) || line;
      return {
        email: emailPart.trim().toLowerCase()
      };
    })
    .filter((entry) => entry.email.includes('@'));
}
