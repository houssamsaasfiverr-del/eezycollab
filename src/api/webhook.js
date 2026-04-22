// api/webhook.js

import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
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
    // Verify webhook signature
    const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;
    const signature = req.headers['dodo-signature'];

    if (!signature || !DODO_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Parse webhook data
    const event = req.body;
    console.log('Received webhook:', event);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdate(event.data);
        break;

      case 'subscription.deleted':
        await handleSubscriptionCancelled(event.data);
        break;
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ 
      error: 'Webhook handler failed',
      message: error.message 
    });
  }
}

async function handleSuccessfulPayment(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  const userId = metadata.userId;
  const now = new Date();
  const nextRenewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Set pro plan data
  await supabase.from('user_credits').upsert({
    user_id: userId,
    plan: 'pro',
    credits: 200,
    credits_remaining: 200,
    total_credits: 200,
    max_credits: 200,
    billing_period: metadata.billingPeriod || 'monthly',
    subscription_plan: '200 credits/month',
    subscription_date: now.toISOString(),
    last_payment_date: now.toISOString(),
    last_reset: now.toISOString(),
    next_reset_date: nextRenewal.toISOString(),
    payment_id: data.id,
    payment_amount: parseFloat(metadata.amount),
    payment_currency: metadata.currency || 'USD',
    daily_prompts_used: 0,
    last_daily_reset: now.toISOString(),
    monthly_credits_used: 0,
    last_monthly_reset: now.toISOString(),
  });
}

async function handleSubscriptionUpdate(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  await supabase.from('user_credits').upsert({
    user_id: metadata.userId,
    subscription_status: data.status,
    updated_at: new Date().toISOString(),
  });
}

async function handleSubscriptionCancelled(data) {
  const { metadata } = data;
  if (!metadata || !metadata.userId) return;

  const userId = metadata.userId;
  const now = new Date();

  // Revert to free plan at the end of billing period
  await supabase.from('user_credits').upsert({
    user_id: userId,
    plan: 'free',
    credits: 30,
    credits_remaining: 30,
    total_credits: 30,
    max_credits: 30,
    billing_period: 'monthly',
    subscription_status: 'cancelled',
    cancelled_at: now.toISOString(),
  });
}