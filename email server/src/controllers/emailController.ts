import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPlatformEmail, sendUserEmail } from '../services/mailerService.js';
import { SendBulkEmailOptions, RecipientInput, UserSmtpConfig } from '../types/index.js';

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

function normalizePort(value: unknown, fallback = 587): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const intValue = Math.trunc(parsed);
  if (intValue <= 0 || intValue > 65535) return fallback;
  return intValue;
}

export async function sendCampaign(req: Request, res: Response) {
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
    } = req.body as SendBulkEmailOptions;

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

    let finalSenderEmail = senderEmail || process.env.PLATFORM_SENDER_EMAIL;
    let finalSenderName = senderName || process.env.PLATFORM_SENDER_NAME || 'CollabFree';

    let userSmtpRow: UserSmtpConfig | null = null;

    if (finalDeliveryMethod === 'user_smtp') {
      const { data: smtpRow, error: smtpError } = await supabaseAdmin
        .from('user_smtp_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (smtpError) {
        return res.status(500).json({ error: smtpError.message || 'Failed to load user SMTP config' });
      }

      userSmtpRow = smtpRow as UserSmtpConfig;

      if (!userSmtpRow || !userSmtpRow.smtp_host || !userSmtpRow.smtp_username || !userSmtpRow.smtp_password) {
        return res.status(400).json({ error: 'User SMTP is not configured. Add host, username, and password in SMTP settings.' });
      }

      if (userSmtpRow.from_email) {
        finalSenderEmail = userSmtpRow.from_email;
      }
      if (userSmtpRow.from_name) {
        finalSenderName = userSmtpRow.from_name;
      }

      if (!finalSenderEmail) {
        return res.status(400).json({ error: 'From email is required for user SMTP sending' });
      }
    }

    if (finalDeliveryMethod === 'project' && !finalSenderEmail) {
      return res.status(500).json({ error: 'PLATFORM_SENDER_EMAIL is missing' });
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

      const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">${htmlEscape(renderedBody).replace(/\n/g, '<br/>')}</div>`;

      try {
        let providerMessageId: string | null = null;

        if (finalDeliveryMethod === 'user_smtp' && userSmtpRow) {
          const sendResult = await sendUserEmail(userSmtpRow, {
            senderEmail: finalSenderEmail as string,
            senderName: finalSenderName as string,
            recipient,
            subject: renderedSubject,
            htmlContent: htmlBody
          });
          providerMessageId = sendResult.messageId || null;
        } else {
          const sendResult = await sendPlatformEmail({
            senderEmail: finalSenderEmail as string,
            senderName: finalSenderName as string,
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
      provider: finalDeliveryMethod === 'user_smtp' ? 'user_smtp' : 'platform_smtp',
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

export async function getInbox(req: Request, res: Response) {
  try {
    const userId = String(req.query.userId || '');
    const projectId = String(req.query.projectId || '');

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    let query = supabaseAdmin
      .from('campaign_emails')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(150);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return res.status(200).json({
      emails: data || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

export async function getSmtpConfig(req: Request, res: Response) {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_smtp_configs')
      .select('user_id, enabled, smtp_host, smtp_port, smtp_secure, smtp_username, from_email, from_name, smtp_password, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const message = String(error.message || 'Failed to load SMTP config');
      return res.status(500).json({ error: message });
    }

    if (!data) {
      return res.status(200).json({
        configured: false,
        enabled: false,
        host: '',
        port: 587,
        secure: false,
        username: '',
        fromEmail: '',
        fromName: '',
        hasPassword: false,
        updatedAt: null
      });
    }

    return res.status(200).json({
      configured: Boolean(data.smtp_host && data.smtp_username && data.smtp_password),
      enabled: Boolean(data.enabled),
      host: String(data.smtp_host || ''),
      port: normalizePort(data.smtp_port, 587),
      secure: Boolean(data.smtp_secure),
      username: String(data.smtp_username || ''),
      fromEmail: String(data.from_email || ''),
      fromName: String(data.from_name || ''),
      hasPassword: Boolean(data.smtp_password),
      updatedAt: data.updated_at || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

export async function saveSmtpConfig(req: Request, res: Response) {
  try {
    const {
      userId,
      enabled,
      host,
      port,
      secure,
      username,
      password,
      fromEmail,
      fromName
    } = (req.body || {}) as {
      userId: string;
      enabled?: boolean;
      host?: string;
      port?: number;
      secure?: boolean;
      username?: string;
      password?: string;
      fromEmail?: string;
      fromName?: string;
    };

    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const cleanHost = String(host || '').trim();
    const cleanUsername = String(username || '').trim();
    const cleanFromEmail = String(fromEmail || '').trim();
    const cleanFromName = String(fromName || '').trim();
    const cleanPassword = String(password || '').trim();

    const finalEnabled = Boolean(enabled);
    const finalPort = normalizePort(port, 587);
    const finalSecure = Boolean(secure) || finalPort === 465;

    if (finalEnabled) {
      if (!cleanHost) return res.status(400).json({ error: 'SMTP host is required' });
      if (!cleanUsername) return res.status(400).json({ error: 'SMTP username is required' });
      if (!cleanFromEmail) return res.status(400).json({ error: 'From email is required' });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('user_smtp_configs')
      .select('smtp_password')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    if (existingError) {
      const message = String(existingError.message || 'Failed to load existing SMTP config');
      return res.status(500).json({ error: message });
    }

    const finalPassword = cleanPassword || String(existing?.smtp_password || '').trim();

    if (finalEnabled && !finalPassword) {
      return res.status(400).json({ error: 'SMTP password is required' });
    }

    const timestamp = new Date().toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('user_smtp_configs')
      .upsert(
        {
          user_id: cleanUserId,
          enabled: finalEnabled,
          smtp_host: cleanHost || null,
          smtp_port: finalPort,
          smtp_secure: finalSecure,
          smtp_username: cleanUsername || null,
          smtp_password: finalPassword || null,
          from_email: cleanFromEmail || null,
          from_name: cleanFromName || null,
          updated_at: timestamp
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      const message = String(upsertError.message || 'Failed to save SMTP config');
      return res.status(500).json({ error: message });
    }

    return res.status(200).json({
      success: true,
      enabled: finalEnabled,
      configured: Boolean(cleanHost && cleanUsername && finalPassword),
      hasPassword: Boolean(finalPassword)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
