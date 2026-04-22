import { supabaseAdmin } from './_supabaseAdmin';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-brevo-signature');
}

function mapStatus(eventName: string): string {
  const event = eventName.toLowerCase();
  if (event.includes('reply')) return 'replied';
  if (event.includes('open')) return 'opened';
  if (event.includes('click')) return 'clicked';
  if (event.includes('delivered')) return 'delivered';
  if (event.includes('hard_bounce') || event.includes('soft_bounce') || event.includes('bounce')) return 'bounced';
  if (event.includes('deferred') || event.includes('blocked')) return 'deferred';
  if (event.includes('invalid')) return 'failed';
  return event || 'processed';
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
    const payload = req.body;
    const events = Array.isArray(payload) ? payload : [payload];

    for (const event of events) {
      const messageId = String(event?.messageId || event?.message_id || '');
      if (!messageId) continue;

      const mappedStatus = mapStatus(String(event?.event || ''));

      await supabaseAdmin
        .from('campaign_emails')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('provider_message_id', messageId);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error';
    return res.status(500).json({ error: message });
  }
}
