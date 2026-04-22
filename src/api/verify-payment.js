// api/verify-payment.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const DODO_API_KEY = process.env.DODO_API_KEY;
    
    if (!DODO_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(`https://api.dodopayments.com/v1/checkout-sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Verification failed',
        details: responseText 
      });
    }

    const data = JSON.parse(responseText);
    
    return res.status(200).json({
      id: sessionId,
      status: data.status || 'paid',
      metadata: data.metadata || {}
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
