// api/stripe-checkout.ts - Vercel serverless function for Stripe checkout

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});

export default async function handler(req: any, res: any) {
    // CORS headers
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
        const {
            userId,
            email,
            packageId,
            credits,
            amount,
            billingPeriod,
            successUrl,
            cancelUrl
        } = req.body;

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }

        // Determine if this is a subscription or one-time payment
        const isSubscription = billingPeriod === 'monthly' || billingPeriod === 'yearly';

        // Create checkout session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            customer_email: email,
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: successUrl || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin}/pricing`,
            metadata: {
                userId,
                packageId,
                credits: credits.toString(),
                billingPeriod
            },
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${credits / 3} Prompts Credit Pack`,
                        description: `${credits} credits for Extension Builder (${credits / 3} prompts)`,
                    },
                    unit_amount: amount, // Amount in cents
                    ...(isSubscription && {
                        recurring: {
                            interval: billingPeriod === 'yearly' ? 'year' : 'month',
                            interval_count: 1
                        }
                    })
                },
                quantity: 1
            }]
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        console.log('✅ Stripe checkout session created:', session.id);

        return res.status(200).json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error: any) {
        console.error('❌ Stripe checkout error:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
}
