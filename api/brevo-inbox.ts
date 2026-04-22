import { supabaseAdmin } from './_supabaseAdmin';
import { listBrevoEvents } from './_brevo';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function mapBrevoEventStatus(event: any): string {
  const eventName = String(event?.event || '').toLowerCase();
  if (eventName.includes('open')) return 'opened';
  if (eventName.includes('click')) return 'clicked';
  if (eventName.includes('reply')) return 'replied';
  if (eventName.includes('hard_bounce') || eventName.includes('soft_bounce') || eventName.includes('bounce')) return 'bounced';
  if (eventName.includes('delivered')) return 'delivered';
  if (eventName.includes('deferred') || eventName.includes('blocked')) return 'deferred';
  return eventName || 'processed';
}

export default async function handler(req: any, res: any) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const rows = Array.isArray(data) ? data : [];
    const messageIdToRow = new Map<string, { status: string; updated_at: string }>();

    for (const row of rows) {
      if (row.provider_message_id) {
        messageIdToRow.set(String(row.provider_message_id), {
          status: String(row.status || ''),
          updated_at: String(row.updated_at || row.created_at || new Date().toISOString())
        });
      }
    }

    try {
      const brevoEvents = await listBrevoEvents(50);
      for (const event of brevoEvents) {
        const messageId = String(event?.messageId || event?.message_id || '');
        if (!messageId || !messageIdToRow.has(messageId)) {
          continue;
        }

        const nextStatus = mapBrevoEventStatus(event);
        const rowState = messageIdToRow.get(messageId);
        if (!rowState || rowState.status === nextStatus) {
          continue;
        }

        await supabaseAdmin
          .from('campaign_emails')
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString()
          })
          .eq('provider_message_id', messageId)
          .eq('user_id', userId);
      }
    } catch (syncError) {
      console.error('Brevo event sync skipped:', syncError);
    }

    const { data: refreshedData, error: refreshedError } = await query;
    if (refreshedError) {
      throw refreshedError;
    }

    return res.status(200).json({
      emails: refreshedData || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
