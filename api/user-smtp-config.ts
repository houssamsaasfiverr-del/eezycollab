import { supabaseAdmin } from './_supabaseAdmin';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizePort(value: unknown, fallback = 587): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const intValue = Math.trunc(parsed);
  if (intValue <= 0 || intValue > 65535) return fallback;
  return intValue;
}

export default async function handler(req: any, res: any) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
