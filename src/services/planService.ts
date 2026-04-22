import { supabase } from '../lib/supabaseClient';
import type { PlanType } from '../types/plans';

export interface PlanData {
  plan: PlanType;
  planStartedAt: string;
  lastPaymentDate: string;
  paymentId?: string;
  paymentAmount?: number;
  updatedAt: string;
}

export const updateUserPlan = async (
  userId: string,
  planType: PlanType,
  paymentDetails?: {
    sessionId: string;
    amount: number;
  }
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();

    const creditsUpdate: Record<string, unknown> = {
      user_id: userId,
      plan: planType,
      updated_at: now
    };

    if (planType === 'pro') {
      Object.assign(creditsUpdate, {
        credits: 200,
        credits_remaining: 200,
        total_credits: 200,
        max_credits: 200
      });
    }

    const userUpdate: Record<string, unknown> = {
      user_id: userId,
      plan: planType,
      plan_started_at: now,
      last_payment_date: now,
      updated_at: now
    };

    if (paymentDetails) {
      userUpdate.payment_id = paymentDetails.sessionId;
      userUpdate.payment_amount = paymentDetails.amount;
    }

    const [creditsResult, userResult] = await Promise.all([
      supabase.from('user_credits').upsert(creditsUpdate),
      supabase.from('profiles').upsert(userUpdate)
    ]);

    if (creditsResult.error) throw creditsResult.error;
    if (userResult.error) throw userResult.error;
    
    return true;
  } catch (error) {
    console.error('Failed to update user plan:', error);
    return false;
  }
};

export const setupPlanListener = (
  userId: string,
  callback: (planData: PlanData) => void
): () => void => {
  const channel = supabase
    .channel(`plan-listener-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        callback({
          plan: (row.plan as PlanType) || 'free',
          planStartedAt: String(row.plan_started_at || ''),
          lastPaymentDate: String(row.last_payment_date || ''),
          paymentId: row.payment_id as string | undefined,
          paymentAmount: row.payment_amount as number | undefined,
          updatedAt: String(row.updated_at || '')
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};