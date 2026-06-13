import nodemailer from 'nodemailer';

export interface SmtpRecipient {
  email: string;
  name?: string;
}

export interface SmtpSendRequest {
  senderEmail: string;
  senderName: string;
  recipient: SmtpRecipient;
  subject: string;
  htmlContent: string;
  tags?: string[];
}

export interface SmtpSendResult {
  messageId: string;
}

function getPlatformSmtpConfig() {
  const host = process.env.PLATFORM_SMTP_HOST || '';
  const port = Number(process.env.PLATFORM_SMTP_PORT || 587);
  const secure = String(process.env.PLATFORM_SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.PLATFORM_SMTP_USER || '';
  const pass = process.env.PLATFORM_SMTP_PASS || '';

  if (!host || !user || !pass) return null;

  return { host, port, secure, user, pass };
}

export async function sendPlatformEmail(request: SmtpSendRequest): Promise<SmtpSendResult> {
  const smtp = getPlatformSmtpConfig();
  if (!smtp) {
    throw new Error('Platform default SMTP is not configured. Set PLATFORM_SMTP_HOST, PLATFORM_SMTP_USER and PLATFORM_SMTP_PASS.');
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

export async function listPlatformEvents() {
  // Pure SMTP setup has no event logging API like Brevo, so return empty array
  return [];
}

function buildTextContent(htmlContent: string): string {
  return htmlContent
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
