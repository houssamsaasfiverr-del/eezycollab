// api/create-checkout.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, amount, currency, plan, billingPeriod } = req.body;

    const DODO_API_KEY = process.env.DODO_API_KEY;
    const BASIC_PRODUCT_ID = process.env.DODO_BASIC_PRODUCT_ID;
    const PRO_PRODUCT_ID = process.env.DODO_PRO_PRODUCT_ID;
    
    if (!DODO_API_KEY || !BASIC_PRODUCT_ID || !PRO_PRODUCT_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const productId = plan === 'pro' ? PRO_PRODUCT_ID : BASIC_PRODUCT_ID;

    const payload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1
        }
      ],
      customer: {
        email: email,
        name: email.split('@')[0]
      },
      return_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: userId,
        plan: plan,
        billingPeriod: billingPeriod,
        amount: amount,
        currency: currency
      },
      billing_currency: currency
    };

    const response = await fetch('https://api.dodopayments.com/v1/checkout-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Dodo API error:', responseText);
      return res.status(response.status).json({ 
        error: 'Payment creation failed', 
        details: responseText 
      });
    }

    const data = JSON.parse(responseText);

    return res.status(200).json({
      session_id: data.session_id,
      checkout_url: data.checkout_url
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
