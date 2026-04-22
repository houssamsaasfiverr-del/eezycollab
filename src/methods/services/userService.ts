import { supabase } from "./../../lib/supabaseClient";

export async function setUserPlanData(userId: string, plan: 'free' | 'pro', timestamp: Date) {
  const iso = timestamp.toISOString();

  await Promise.all([
    supabase.from('profiles').upsert({
      user_id: userId,
      plan,
      plan_started_at: iso,
      updated_at: iso
    }),
    supabase.from('user_credits').upsert({
      user_id: userId,
      plan,
      updated_at: iso
    })
  ]);
}

export async function getUserPlanData(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user plan data:', error);
    return null;
  }

  return data;
}
