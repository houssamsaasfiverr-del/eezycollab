// src/hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export interface UserData {
  credits: number;
  maxCredits: number;
  plan: 'free' | 'pro' | 'basic';
  subscriptionPlan?: string;
  billingPeriod?: 'monthly' | 'yearly';
  subscriptionDate?: string;
  nextRenewalDate?: string;
  paymentAmount?: number;
  dailyPromptsUsed: number;
  lastDailyReset: string;
  monthlyCreditsUsed: number;
  lastMonthlyReset: string;
}

export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const hydrate = async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      if (data) {
        setUserData({
          credits: data.credits_remaining || 30,
          maxCredits: data.max_credits || 30,
          plan: data.plan || 'free',
          subscriptionPlan: data.subscription_plan,
          billingPeriod: data.billing_period,
          subscriptionDate: data.subscription_date,
          nextRenewalDate: data.next_reset_date,
          paymentAmount: data.payment_amount,
          dailyPromptsUsed: data.daily_prompts_used || 0,
          lastDailyReset: data.last_daily_reset || now,
          monthlyCreditsUsed: data.monthly_credits_used || 0,
          lastMonthlyReset: data.last_monthly_reset || now,
        });
      } else {
        setUserData({
          credits: 30,
          maxCredits: 30,
          plan: 'free',
          dailyPromptsUsed: 0,
          lastDailyReset: now,
          monthlyCreditsUsed: 0,
          lastMonthlyReset: now,
        });
      }
      setLoading(false);
    };

    hydrate();

    const channel = supabase
      .channel(`user-credits-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.uid}`
        },
        () => {
          void hydrate();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return { userData, loading };
};
