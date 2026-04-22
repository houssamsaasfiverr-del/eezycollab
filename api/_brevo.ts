import nodemailer from 'nodemailer';

const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoSendRequest {
  senderEmail: string;
  senderName: string;
  recipient: BrevoRecipient;
  subject: string;
  htmlContent: string;
  tags?: string[];
}

export interface BrevoSendResult {
  messageId: string;
}

function readBrevoApiKey(): string | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  if (apiKey.startsWith('xsmtpsib-')) {
    throw new Error('BREVO_API_KEY appears to be an SMTP key (xsmtpsib). Use xkeysib for API or configure SMTP vars.');
  }

  if (!apiKey.startsWith('xkeysib-')) {
    throw new Error('BREVO_API_KEY has invalid format. Expected key starting with xkeysib-.');
  }

  return apiKey;
}

function getSmtpConfig() {
  const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const secure = String(process.env.BREVO_SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.BREVO_SMTP_USER || process.env.BREVO_SMTP_LOGIN || '';
  const pass = process.env.BREVO_SMTP_PASS || process.env.BREVO_SMTP_KEY || '';

  if (!user || !pass) return null;

  return { host, port, secure, user, pass };
}

async function sendViaBrevoApi(request: BrevoSendRequest, apiKey: string): Promise<BrevoSendResult> {
  const response = await fetch(`${BREVO_API_BASE_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender: {
        email: request.senderEmail,
        name: request.senderName
      },
      to: [request.recipient],
      subject: request.subject,
      htmlContent: request.htmlContent,
      textContent: buildTextContent(request.htmlContent),
      tags: request.tags || []
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || payload?.code || 'Brevo API send failed';
    throw new Error(message);
  }

  return {
    messageId: String(payload?.messageId || '')
  };
}

async function sendViaBrevoSmtp(request: BrevoSendRequest): Promise<BrevoSendResult> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    throw new Error('Brevo SMTP is not configured. Set BREVO_SMTP_USER and BREVO_SMTP_PASS.');
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });

  const info = await transport.sendMail({
    from: `${request.senderName} <${request.senderEmail}>`,
    to: request.recipient.name
      ? `${request.recipient.name} <${request.recipient.email}>`
      : request.recipient.email,
    subject: request.subject,
    html: request.htmlContent,
    text: buildTextContent(request.htmlContent)
  });

  return {
    messageId: String(info.messageId || '')
  };
}

function buildTextContent(htmlContent: string): string {
  return htmlContent
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sendBrevoEmail(request: BrevoSendRequest): Promise<BrevoSendResult> {
  const apiKey = readBrevoApiKey();
  if (apiKey) {
    return sendViaBrevoApi(request, apiKey);
  }

  return sendViaBrevoSmtp(request);
}

export async function listBrevoEvents(limit = 30) {
  const apiKey = readBrevoApiKey();
  if (!apiKey) {
    return [];
  }

  const response = await fetch(`${BREVO_API_BASE_URL}/smtp/statistics/events?limit=${limit}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'api-key': apiKey
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || payload?.code || 'Brevo events fetch failed';
    throw new Error(message);
  }

  return Array.isArray(payload?.events) ? payload.events : [];
}
