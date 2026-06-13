import { supabaseAdmin } from './_supabaseAdmin';

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

    return res.status(200).json({
      emails: data || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

