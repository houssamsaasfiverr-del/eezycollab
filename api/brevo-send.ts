import { supabaseAdmin } from './_supabaseAdmin';
import { sendBrevoEmail } from './_brevo';

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
      subject,
      messageTemplate,
      recipients
    } = req.body as {
      userId: string;
      projectId?: string;
      senderName?: string;
      senderEmail?: string;
      subject: string;
      messageTemplate: string;
      recipients: RecipientInput[];
    };

    if (!userId || !subject || !messageTemplate || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanRecipients = recipients
      .map((entry) => ({
        email: String(entry.email || '').trim(),
        name: String(entry.name || '').trim()
      }))
      .filter((entry) => entry.email.includes('@'));

    if (cleanRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipient emails provided' });
    }

    const finalSenderEmail = senderEmail || process.env.BREVO_SENDER_EMAIL;
    const finalSenderName = senderName || process.env.BREVO_SENDER_NAME || 'CollabFree';

    if (!finalSenderEmail) {
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
        const sendResult = await sendBrevoEmail({
          senderEmail: finalSenderEmail,
          senderName: finalSenderName,
          recipient,
          subject: renderedSubject,
          htmlContent: htmlBody,
          tags: ['collabfree', 'campaign-outreach']
        });

        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'sent',
          providerMessageId: sendResult.messageId || null,
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
      provider: 'brevo',
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
