// src/methods/services/CreditService.ts - UPDATED WITH NEW CREDIT SYSTEM

import { supabase } from '../../lib/supabaseClient';
import { CREDITS_PER_PROMPT, FREE_PLAN } from '../../types/plans';

export interface UserCredits {
  plan: 'free' | 'pro';
  credits: number;
  maxCredits: number;
  billingPeriod: 'monthly' | 'yearly';
  lastResetDate: string;
  nextResetDate: string;
  createdAt: string;
  updatedAt: string;
  subscriptionDate?: string;
  paymentAmount?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Free trial tracking
  hasUsedFreeTrial: boolean;
  freeTrialUsedAt?: string;

  // User info fields
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: string;
}

// Initialize user credits with email/name
export async function initializeUserCredits(
  userId: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  try {
    const { data: userDoc, error: findError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;

    if (!userDoc) {
      // Create new user with FREE plan credits (1 prompt = 3 credits)
      const now = new Date();
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: FREE_PLAN.credits,  // 3 credits = 1 prompt
        maxCredits: FREE_PLAN.credits,
        billingPeriod: 'monthly',
        lastResetDate: now.toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        hasUsedFreeTrial: false,
        // User info
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || undefined,
        lastLogin: now.toISOString()
      };

      const { error: insertError } = await supabase.from('user_credits').insert({
        user_id: userId,
        plan: defaultCredits.plan,
        credits: defaultCredits.credits,
        max_credits: defaultCredits.maxCredits,
        credits_remaining: defaultCredits.credits,
        total_credits: defaultCredits.credits,
        billing_period: defaultCredits.billingPeriod,
        last_reset_date: defaultCredits.lastResetDate,
        next_reset_date: defaultCredits.nextResetDate,
        created_at: defaultCredits.createdAt,
        updated_at: defaultCredits.updatedAt,
        has_used_free_trial: defaultCredits.hasUsedFreeTrial,
        email,
        display_name: displayName || email.split('@')[0],
        photo_url: photoURL || null,
        last_login: now.toISOString()
      });

      if (insertError) throw insertError;

      console.log('✅ User credits initialized for:', email);
    } else {
      // Update existing user's login time and info
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
        last_login: new Date().toISOString(),
        email: email,
        display_name: displayName || email.split('@')[0],
        photo_url: photoURL || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

      if (updateError) throw updateError;

      console.log('✅ User info updated for:', email);
    }
  } catch (error) {
    console.error('❌ Error initializing user credits:', error);
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create default free user
      const defaultCredits: UserCredits = {
        plan: 'free',
        credits: FREE_PLAN.credits,
        maxCredits: FREE_PLAN.credits,
        billingPeriod: 'monthly',
        lastResetDate: new Date().toISOString(),
        nextResetDate: getNextResetDate(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasUsedFreeTrial: false
      };

      const { error: insertError } = await supabase.from('user_credits').insert({
        user_id: userId,
        plan: defaultCredits.plan,
        credits: defaultCredits.credits,
        max_credits: defaultCredits.maxCredits,
        credits_remaining: FREE_PLAN.credits,
        total_credits: FREE_PLAN.credits,
        billing_period: defaultCredits.billingPeriod,
        last_reset_date: defaultCredits.lastResetDate,
        next_reset_date: defaultCredits.nextResetDate,
        created_at: defaultCredits.createdAt,
        updated_at: defaultCredits.updatedAt,
        has_used_free_trial: false
      });

      if (insertError) throw insertError;

      return defaultCredits;
    }

    const userPlan = (data.plan || 'free') as 'free' | 'pro';
    const maxCredits = data.total_credits || data.max_credits || FREE_PLAN.credits;
    const currentCredits = data.credits_remaining ?? data.credits ?? maxCredits;

    return {
      plan: userPlan,
      credits: currentCredits,
      maxCredits: maxCredits,
      billingPeriod: data.billing_period || 'monthly',
      lastResetDate: data.last_reset || data.last_reset_date || new Date().toISOString(),
      nextResetDate: data.next_reset_date || getNextResetDate(),
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      subscriptionDate: data.subscription_date,
      paymentAmount: data.payment_amount,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      hasUsedFreeTrial: data.has_used_free_trial || false,
      freeTrialUsedAt: data.free_trial_used_at,
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      lastLogin: data.last_login
    };
  } catch (error) {
    console.error('[CREDITS] Error:', error);
    return null;
  }
}

// Check if user has enough credits for a prompt
export async function hasCreditsAvailable(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return false;

  // Need at least CREDITS_PER_PROMPT credits to generate
  return credits.credits >= CREDITS_PER_PROMPT;
}

// Check if free user needs to upgrade (used their 1 free prompt)
export async function needsUpgrade(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return false;

  // Free mode policy: do not hard-block users behind plan upgrades.
  return false;
}

// Use credits for a prompt (costs CREDITS_PER_PROMPT = 3)
export async function useCredit(userId: string): Promise<boolean> {
  try {
    const { data, error: findError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError || !data) return false;

    const currentCredits = data.credits_remaining ?? data.credits ?? 0;
    const userPlan = data.plan || 'free';

    if (currentCredits < CREDITS_PER_PROMPT) {
      console.error('[CREDITS] Not enough credits. Need:', CREDITS_PER_PROMPT, 'Have:', currentCredits);
      return false;
    }

    const newCredits = currentCredits - CREDITS_PER_PROMPT;

    // Update credits and mark free trial as used if applicable
    const updateData: Record<string, unknown> = {
      credits_remaining: newCredits,
      credits: newCredits,
      updated_at: new Date().toISOString()
    };

    // If free user using their only prompt, mark trial as used
    if (userPlan === 'free' && !data.has_used_free_trial) {
      updateData.has_used_free_trial = true;
      updateData.free_trial_used_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('user_credits')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log('[CREDITS] Used', CREDITS_PER_PROMPT, 'credits. Remaining:', newCredits);
    return true;
  } catch (error) {
    console.error('[CREDITS] Error using credit:', error);
    return false;
  }
}

// Add credits after purchase
export async function addCredits(userId: string, creditsToAdd: number, plan: 'free' | 'pro' = 'pro'): Promise<boolean> {
  try {
    const { data: existingData, error: findError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;

    const currentCredits = existingData?.credits_remaining ?? existingData?.credits ?? 0;
    const newCredits = currentCredits + creditsToAdd;

    const { error: upsertError } = await supabase.from('user_credits').upsert({
      user_id: userId,
      ...existingData,
      plan: plan,
      credits: newCredits,
      credits_remaining: newCredits,
      max_credits: Math.max(newCredits, existingData?.max_credits || 0),
      total_credits: Math.max(newCredits, existingData?.total_credits || 0),
      updated_at: new Date().toISOString(),
      last_reset_date: new Date().toISOString(),
      next_reset_date: getNextResetDate()
    });

    if (upsertError) throw upsertError;

    console.log('[CREDITS] Added', creditsToAdd, 'credits. New total:', newCredits);
    return true;
  } catch (error) {
    console.error('[CREDITS] Error adding credits:', error);
    return false;
  }
}

function getNextResetDate(): string {
  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + 30);
  return nextReset.toISOString();
}

export function getDaysUntilReset(nextResetDate: string): number {
  const now = new Date();
  const resetDate = new Date(nextResetDate);
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export async function resetCredits(userId: string): Promise<boolean> {
  try {
    const { data, error: findError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError || !data) return false;

    const maxCredits = data.total_credits || data.max_credits || FREE_PLAN.credits;

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
      credits_remaining: maxCredits,
      credits: maxCredits,
      last_reset: new Date().toISOString(),
      last_reset_date: new Date().toISOString(),
      next_reset_date: getNextResetDate(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('[CREDITS] Error resetting:', error);
    return false;
  }
}

export function formatResetDate(nextResetDate: string): string {
  const date = new Date(nextResetDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Get prompts remaining (credits / CREDITS_PER_PROMPT)
export function getPromptsRemaining(credits: number): number {
  return Math.floor(credits / CREDITS_PER_PROMPT);
}
