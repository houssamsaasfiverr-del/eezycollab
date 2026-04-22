// api/stripe-webhook.ts - Vercel serverless function for Stripe webhooks

import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
    api: {
        bodyParser: false // Stripe needs raw body for signature verification
    }
};

// Helper to read raw body
async function getRawBody(req: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'];

        if (!signature || !endpointSecret) {
            console.error('Missing webhook signature or secret');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log('📨 Received Stripe webhook:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        return res.status(500).json({
            error: 'Webhook handler failed',
            message: error.message
        });
    }
}

// Handle successful checkout - add credits to user
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.userId) {
        console.error('No userId in session metadata');
        return;
    }

    const userId = metadata.userId;
    const credits = parseInt(metadata.credits || '0', 10);
    const packageId = metadata.packageId;

    console.log(`✅ Checkout complete for user ${userId}: ${credits} credits`);

    const { data: existingData } = await supabaseAdmin
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    const currentCredits = existingData?.credits_remaining || existingData?.credits || 0;
    const newCredits = currentCredits + credits;
    const now = new Date();

    const { error } = await supabaseAdmin.from('user_credits').upsert({
        user_id: userId,
        ...existingData,
        plan: 'pro',
        credits: newCredits,
        credits_remaining: newCredits,
        max_credits: Math.max(newCredits, existingData?.max_credits || 0),
        total_credits: Math.max(newCredits, existingData?.total_credits || 0),
        billing_period: metadata.billingPeriod || 'monthly',
        subscription_date: now.toISOString(),
        last_payment_date: now.toISOString(),
        last_reset_date: now.toISOString(),
        next_reset_date: getNextResetDate(metadata.billingPeriod as string),
        stripe_customer_id: session.customer as string,
        stripe_session_id: session.id,
        package_id: packageId,
        updated_at: now.toISOString()
    });

    if (error) throw error;

    console.log(`✅ User ${userId} now has ${newCredits} credits`);
}

// Handle subscription invoice paid - renewal credits
async function handleInvoicePaid(invoice: Stripe.Invoice) {
    // Get subscription to find metadata
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const metadata = subscription.metadata;

    if (!metadata || !metadata.userId) {
        console.error('No userId in subscription metadata');
        return;
    }

    const userId = metadata.userId;
    const credits = parseInt(metadata.credits || '0', 10);

    console.log(`✅ Invoice paid for user ${userId}: renewing ${credits} credits`);

    const now = new Date();

    // Reset credits to purchased amount on renewal
    const { error } = await supabaseAdmin
        .from('user_credits')
        .upsert({
        user_id: userId,
        credits: credits,
        credits_remaining: credits,
        max_credits: credits,
        total_credits: credits,
        last_payment_date: now.toISOString(),
        last_reset_date: now.toISOString(),
        next_reset_date: getNextResetDate(metadata.billingPeriod as string),
        updated_at: now.toISOString()
    });

    if (error) throw error;

    console.log(`✅ User ${userId} credits renewed to ${credits}`);
}

// Handle subscription update
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    if (!metadata || !metadata.userId) return;

    const userId = metadata.userId;
    const { error } = await supabaseAdmin
        .from('user_credits')
        .upsert({
        user_id: userId,
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
    });

    if (error) throw error;

    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    if (!metadata || !metadata.userId) return;

    const userId = metadata.userId;
    const now = new Date();

    // Downgrade to free plan
    const { error } = await supabaseAdmin
        .from('user_credits')
        .upsert({
        user_id: userId,
        plan: 'free',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        cancelled_at: now.toISOString(),
        updated_at: now.toISOString()
        // Keep existing credits until they run out
    });

    if (error) throw error;

    console.log(`✅ Subscription cancelled for user ${userId}`);
}

function getNextResetDate(billingPeriod: string): string {
    const nextReset = new Date();
    if (billingPeriod === 'yearly') {
        nextReset.setFullYear(nextReset.getFullYear() + 1);
    } else {
        nextReset.setMonth(nextReset.getMonth() + 1);
    }
    return nextReset.toISOString();
}
