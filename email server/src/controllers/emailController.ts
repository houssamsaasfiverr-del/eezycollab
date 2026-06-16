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
      const { data: smtpRow, error: smtpError } = await (supabaseAdmin.from('user_smtp_configs') as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (smtpError) {
        return res.status(500).json({ error: smtpError.message || 'Failed to load user SMTP config' });
      }

      userSmtpRow = smtpRow as any as UserSmtpConfig;

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

    let projectDescription = '';
    let platformName = 'YouTube';
    let hashtagsList = '';

    if (projectId) {
      const { data: projectRow, error: projectError } = await (supabaseAdmin
        .from('projects') as any)
        .select('first_prompt, files')
        .eq('id', projectId)
        .maybeSingle();

      if (!projectError && projectRow) {
        projectDescription = projectRow.first_prompt || '';
        try {
          const files = projectRow.files;
          if (Array.isArray(files) && files.length > 0) {
            const draftFile = files.find((f: any) => f.name === 'campaign-draft.json');
            if (draftFile && draftFile.content) {
              const draftObj = JSON.parse(draftFile.content);
              platformName = draftObj.platform || 'YouTube';
              hashtagsList = draftObj.hashtags || '';
            }
          }
        } catch (e) {
          console.error('Failed to parse project draft files:', e);
        }
      }
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

      // Extract greeting and rest of the body from the renderedBody template
      let greetingLine = `Hi ${safeName},`;
      let remainingHtmlBody = '';
      
      const trimmedBody = renderedBody.trim();
      const firstNewlineIndex = trimmedBody.indexOf('\n');
      if (firstNewlineIndex !== -1) {
        greetingLine = trimmedBody.substring(0, firstNewlineIndex).trim();
        const rawContent = trimmedBody.substring(firstNewlineIndex).trim();
        // Split by newlines, wrap non-empty in paragraphs, highlight "collaborate"
        remainingHtmlBody = rawContent
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map(line => {
            const escaped = htmlEscape(line);
            // Highlight "collaborate" with color and bold
            const highlighted = escaped.replace(/\bcollaborate\b/gi, '<span style="color: #6366f1; font-weight: 700;">collaborate</span>');
            return `<p style="font-size: 15px; line-height: 1.7; color: #4b4869; margin: 0 0 16px 0; font-family: sans-serif;">${highlighted}</p>`;
          })
          .join('');
      } else {
        remainingHtmlBody = `<p style="font-size: 15px; line-height: 1.7; color: #4b4869; margin: 0 0 16px 0; font-family: sans-serif;">${htmlEscape(trimmedBody)}</p>`;
      }

      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const handshakeImgUrl = `${baseUrl}/illustration-handshake.png`;

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CollabFree Partnership</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f5fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f5fc; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.05); border: 1px solid #eae6f3;">
                  
                  <!-- Header Logo -->
                  <tr>
                    <td style="padding: 30px 40px 15px; background: #ffffff; border-bottom: 1px solid #f3f2f8;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="left" style="vertical-align: middle;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align: middle;">
                                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #6366f1; color: #ffffff; font-weight: bold; font-size: 18px; line-height: 32px; text-align: center; font-family: sans-serif;">C</div>
                                </td>
                                <td style="vertical-align: middle; padding-left: 8px;">
                                  <span style="font-size: 20px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; font-family: sans-serif;">CollabFree</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="right" style="vertical-align: middle; font-size: 11px; color: #8b8998; font-weight: 500; font-family: sans-serif;">
                            Empowering Brands. Building Futures.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content (Two Columns for Text & Handshake Illustration) -->
                  <tr>
                    <td style="padding: 40px 40px 30px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- Left Column: Text -->
                          <td align="left" style="vertical-align: top; width: 62%;">
                            <h1 style="font-size: 24px; font-weight: 800; color: #1e1b4b; margin: 0 0 20px 0; font-family: sans-serif; letter-spacing: -0.5px;">
                              ${htmlEscape(greetingLine)}
                            </h1>
                            ${remainingHtmlBody}
                          </td>
                          
                          <!-- Right Column: Handshake Image -->
                          <td align="center" style="vertical-align: middle; width: 38%; padding-left: 20px;">
                            <img src="${handshakeImgUrl}" width="180" style="display: block; width: 100%; max-width: 180px; height: auto; border: 0;" alt="CollabFree Illustration" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- 3-Column Features Card -->
                  <tr>
                    <td style="padding: 0 40px 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9ff; border: 1px solid #eae6f3; border-radius: 12px; padding: 20px 15px;">
                        <tr>
                          <!-- Feature 1: New Campaign -->
                          <td width="33.33%" align="left" style="vertical-align: middle; padding: 0 10px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align: middle;">
                                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #eef2ff; color: #6366f1; font-size: 15px; line-height: 32px; text-align: center;">🎯</div>
                                </td>
                                <td style="vertical-align: middle; padding-left: 8px;">
                                  <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; font-family: sans-serif;">New Campaign</div>
                                  <div style="font-size: 11px; color: #6b7280; font-weight: 500; font-family: sans-serif; margin-top: 1px;">Brand collaboration</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <!-- Feature 2: Timelines -->
                          <td width="33.33%" align="left" style="vertical-align: middle; padding: 0 10px; border-left: 1px solid #eae6f3;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align: middle; padding-left: 10px;">
                                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #eef2ff; color: #6366f1; font-size: 15px; line-height: 32px; text-align: center;">📅</div>
                                </td>
                                <td style="vertical-align: middle; padding-left: 8px;">
                                  <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; font-family: sans-serif;">Timelines</div>
                                  <div style="font-size: 11px; color: #6b7280; font-weight: 500; font-family: sans-serif; margin-top: 1px;">Flexible structure</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <!-- Feature 3: Partnership -->
                          <td width="33.33%" align="left" style="vertical-align: middle; padding: 0 10px; border-left: 1px solid #eae6f3;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align: middle; padding-left: 10px;">
                                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #eef2ff; color: #6366f1; font-size: 15px; line-height: 32px; text-align: center;">👥</div>
                                </td>
                                <td style="vertical-align: middle; padding-left: 8px;">
                                  <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; font-family: sans-serif;">Partnership</div>
                                  <div style="font-size: 11px; color: #6b7280; font-weight: 500; font-family: sans-serif; margin-top: 1px;">Impact together</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Campaign Details (Direct Content instead of button) -->
                  <tr>
                    <td style="padding: 10px 40px 40px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfbfe; border: 1px dashed #c7c4e6; border-radius: 12px; padding: 22px;">
                        <tr>
                          <td align="left" style="font-family: sans-serif;">
                            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">Campaign Details</h3>
                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4b4869;">
                              ${htmlEscape(projectDescription || 'No additional campaign description provided.')}
                            </p>
                            ${platformName || hashtagsList ? `
                              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #eae6f3; font-size: 11px; color: #8b8998;">
                                ${platformName ? `<span style="margin-right: 15px;"><strong>Platform:</strong> ${htmlEscape(platformName)}</span>` : ''}
                                ${hashtagsList ? `<span><strong>Hashtags:</strong> ${htmlEscape(hashtagsList)}</span>` : ''}
                              </div>
                            ` : ''}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f3f2f8; padding-top: 20px;">
                        <tr>
                          <td align="center" style="font-size: 11px; color: #8b8998; line-height: 1.5; font-family: sans-serif;">
                            Sent with ❤️ by <a href="https://collabfree.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">CollabFree</a> &bull; Connect with the best brands.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

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

    const { error: insertError } = await (supabaseAdmin.from('campaign_emails') as any).insert(rows);
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

    let query = (supabaseAdmin
      .from('campaign_emails') as any)
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

    const { data, error } = await (supabaseAdmin
      .from('user_smtp_configs') as any)
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

    const { data: existing, error: existingError } = await (supabaseAdmin
      .from('user_smtp_configs') as any)
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

    const { error: upsertError } = await (supabaseAdmin
      .from('user_smtp_configs') as any)
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
