import { supabaseAdmin } from './_supabaseAdmin';
import { sendBrevoEmail } from './_brevo';
import nodemailer from 'nodemailer';

interface RecipientInput {
  email: string;
  name?: string;
}

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function fillTemplate(input: string, values: Record<string, string>) {
  return input.replace(/{{\s*(\w+)\s*}}/g, (_match, key: string) => values[key] || '');
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
      userId,
      projectId,
      senderName,
      senderEmail,
      deliveryMethod,
      subject,
      messageTemplate,
      recipients
    } = req.body as {
      userId: string;
      projectId?: string;
      senderName?: string;
      senderEmail?: string;
      deliveryMethod?: 'project' | 'user_smtp';
      subject: string;
      messageTemplate: string;
      recipients: RecipientInput[];
    };

    if (!userId || !subject || !messageTemplate || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalDeliveryMethod: 'project' | 'user_smtp' = deliveryMethod === 'user_smtp' ? 'user_smtp' : 'project';

    const cleanRecipients = recipients
      .map((entry) => ({
        email: String(entry.email || '').trim(),
        name: String(entry.name || '').trim()
      }))
      .filter((entry) => entry.email.includes('@'));

    if (cleanRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipient emails provided' });
    }

    let finalSenderEmail = senderEmail || process.env.BREVO_SENDER_EMAIL;
    let finalSenderName = senderName || process.env.BREVO_SENDER_NAME || 'CollabFree';

    let smtpTransport: nodemailer.Transporter | null = null;

    if (finalDeliveryMethod === 'user_smtp') {
      const { data: smtpRow, error: smtpError } = await supabaseAdmin
        .from('user_smtp_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (smtpError) {
        return res.status(500).json({ error: smtpError.message || 'Failed to load user SMTP config' });
      }

      const host = String(smtpRow?.smtp_host || '').trim();
      const port = Number(smtpRow?.smtp_port || 587);
      const secure = Boolean(smtpRow?.smtp_secure) || port === 465;
      const username = String(smtpRow?.smtp_username || '').trim();
      const password = String(smtpRow?.smtp_password || '').trim();
      const fromEmail = String(smtpRow?.from_email || '').trim();
      const fromName = String(smtpRow?.from_name || '').trim();

      if (!host || !username || !password) {
        return res.status(400).json({ error: 'User SMTP is not configured. Add host, username, and password in SMTP settings.' });
      }

      if (fromEmail) {
        finalSenderEmail = fromEmail;
      }
      if (fromName) {
        finalSenderName = fromName;
      }

      if (!finalSenderEmail) {
        return res.status(400).json({ error: 'From email is required for user SMTP sending' });
      }

      smtpTransport = nodemailer.createTransport({
        host,
        port: Number.isFinite(port) ? port : 587,
        secure,
        auth: {
          user: username,
          pass: password
        }
      });
    }

    if (finalDeliveryMethod === 'project' && !finalSenderEmail) {
      return res.status(500).json({ error: 'BREVO_SENDER_EMAIL is missing' });
    }

    const results: Array<{
      email: string;
      name?: string;
      status: 'sent' | 'failed';
      providerMessageId: string | null;
      error: string | null;
    }> = [];

    for (const recipient of cleanRecipients) {
      const safeName = recipient.name || recipient.email.split('@')[0] || 'Creator';
      const renderedSubject = fillTemplate(subject, { name: safeName, email: recipient.email });
      const renderedBody = fillTemplate(messageTemplate, { name: safeName, email: recipient.email });

      const htmlBody = `<div style=\"font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222\">${htmlEscape(renderedBody).replace(/\n/g, '<br/>')}</div>`;

      try {
        let providerMessageId: string | null = null;

        if (finalDeliveryMethod === 'user_smtp') {
          const info = await smtpTransport!.sendMail({
            from: `${finalSenderName} <${finalSenderEmail}>`,
            to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
            subject: renderedSubject,
            html: htmlBody,
            text: buildTextContent(htmlBody)
          });

          providerMessageId = String(info.messageId || '');
        } else {
          const sendResult = await sendBrevoEmail({
            senderEmail: finalSenderEmail,
            senderName: finalSenderName,
            recipient,
            subject: renderedSubject,
            htmlContent: htmlBody,
            tags: ['collabfree', 'campaign-outreach']
          });
          providerMessageId = sendResult.messageId || null;
        }

        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'sent',
          providerMessageId,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Send failed';
        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'failed',
          providerMessageId: null,
          error: errorMessage
        });
      }
    }

    const timestamp = new Date().toISOString();
    const rows = results.map((item) => ({
      user_id: userId,
      project_id: projectId || null,
      direction: 'outbound',
      provider: finalDeliveryMethod === 'user_smtp' ? 'user_smtp' : 'brevo',
      recipient_email: item.email,
      recipient_name: item.name || null,
      sender_email: finalSenderEmail,
      subject,
      body_text: messageTemplate,
      status: item.status,
      provider_message_id: item.providerMessageId,
      error_message: item.error,
      sent_at: item.status === 'sent' ? timestamp : null,
      created_at: timestamp,
      updated_at: timestamp
    }));

    const { error: insertError } = await supabaseAdmin.from('campaign_emails').insert(rows);
    if (insertError) {
      console.error('Failed to persist campaign emails:', insertError);
    }

    const sentCount = results.filter((item) => item.status === 'sent').length;
    const failedCount = results.length - sentCount;

    return res.status(200).json({
      sentCount,
      failedCount,
      total: results.length,
      results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

function buildTextContent(htmlContent: string): string {
  return htmlContent
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
