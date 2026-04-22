const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getBrevoApiKey() {
  const apiKey = process.env.BREVO_API_KEY || '';
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is missing.');
  }
  if (!apiKey.startsWith('xkeysib-')) {
    throw new Error('BREVO_API_KEY must start with xkeysib-.');
  }
  return apiKey;
}

export default async function handler(req: any, res: any) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      subject,
      senderName,
      senderEmail,
      htmlContent,
      listIds,
      scheduledAt
    } = req.body as {
      name: string;
      subject: string;
      senderName: string;
      senderEmail: string;
      htmlContent: string;
      listIds: number[];
      scheduledAt?: string;
    };

    if (!name || !subject || !senderName || !senderEmail || !htmlContent || !Array.isArray(listIds) || listIds.length === 0) {
      return res.status(400).json({ error: 'Missing required campaign fields' });
    }

    const payload: Record<string, unknown> = {
      name,
      subject,
      sender: {
        name: senderName,
        email: senderEmail
      },
      type: 'classic',
      htmlContent,
      recipients: {
        listIds
      }
    };

    if (scheduledAt) {
      payload.scheduledAt = scheduledAt;
    }

    const response = await fetch(`${BREVO_API_BASE_URL}/emailCampaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': getBrevoApiKey()
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result?.message || result?.code || 'Brevo campaign creation failed';
      return res.status(500).json({ error: message, details: result });
    }

    return res.status(200).json({
      success: true,
      campaignId: result?.id,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
