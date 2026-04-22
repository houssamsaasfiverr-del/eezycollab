import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface PendingPurchase {
  userId: string;
  credits: string;
  amount: string;
  billingPeriod?: string;
}

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<PendingPurchase | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const subscriptionId = searchParams.get('subscription_id');
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');

        if (status !== 'active' && !subscriptionId && !paymentId) {
          throw new Error('Payment was not confirmed.');
        }

        if (!user) {
          throw new Error('Please log in to complete activation.');
        }

        const pendingPurchaseRaw = localStorage.getItem('pendingPurchase');
        if (!pendingPurchaseRaw) {
          throw new Error('Purchase details are missing. Please contact support.');
        }

        const pendingPurchase = JSON.parse(pendingPurchaseRaw) as PendingPurchase;
        setPurchaseDetails(pendingPurchase);

        if (pendingPurchase.userId !== user.uid) {
          throw new Error('User verification failed.');
        }

        const credits = Number(pendingPurchase.credits);
        const amount = Number(pendingPurchase.amount);
        const now = new Date();
        const renewal = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const { error: upsertError } = await supabase.from('user_credits').upsert({
            user_id: user.uid,
            plan: 'pro',
            credits,
            credits_remaining: credits,
            total_credits: credits,
            max_credits: credits,
            billing_period: pendingPurchase.billingPeriod || 'monthly',
            subscription_date: now.toISOString(),
            last_payment_date: now.toISOString(),
            next_reset_date: renewal.toISOString(),
            subscription_id: subscriptionId || paymentId || `dodo_${Date.now()}`,
            payment_id: paymentId || subscriptionId || `dodo_${Date.now()}`,
            payment_status: status || 'active',
            payment_amount: amount,
            payment_currency: 'USD',
            updated_at: now.toISOString()
          });

        if (upsertError) throw upsertError;

        const { data: verify, error: verifyError } = await supabase
          .from('user_credits')
          .select('plan')
          .eq('user_id', user.uid)
          .maybeSingle();

        if (verifyError || !verify || verify.plan !== 'pro') {
          throw new Error('Activation verification failed.');
        }

        localStorage.removeItem('pendingPurchase');
        setSuccess(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Activation failed.';
        setError(message);
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, user]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2500);
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <div className="ec-pay-page">
      <div className="ec-pay-card">
        {processing && (
          <>
            <Loader2 className="spin" size={24} />
            <h1>Activating your CollabFree Pro plan</h1>
            <p>Please wait while we update your credits and subscription status.</p>
          </>
        )}

        {!processing && error && (
          <>
            <AlertTriangle size={26} color="#b53d3d" />
            <h1>Activation issue</h1>
            <p>{error}</p>
            <button onClick={() => (window.location.href = '/dashboard')}>Go to Dashboard</button>
          </>
        )}

        {!processing && success && (
          <>
            <CheckCircle2 size={26} color="#228a51" />
            <h1>Pro activated successfully</h1>
            <p>
              {purchaseDetails ? `${purchaseDetails.credits} credits/month unlocked.` : 'Your new credits are ready.'}
            </p>
            <div className="ec-pay-pill">
              <Sparkles size={14} /> Redirecting to dashboard...
            </div>
          </>
        )}
      </div>

      <style>{`
        .ec-pay-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 20% 15%, rgba(248, 130, 49, 0.24), transparent 30%),
            radial-gradient(circle at 80% 75%, rgba(225, 84, 40, 0.2), transparent 26%),
            #fff8ef;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .ec-pay-card {
          width: min(520px, 92%);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ecdccf;
          border-radius: 20px;
          padding: 28px;
          text-align: center;
          display: grid;
          justify-items: center;
          gap: 10px;
          box-shadow: 0 24px 42px rgba(182, 130, 87, 0.2);
        }

        h1 {
          font-size: clamp(26px, 3.5vw, 34px);
          letter-spacing: -0.03em;
        }

        p {
          color: #6d5b4d;
          line-height: 1.6;
          max-width: 420px;
        }

        button {
          border: 0;
          border-radius: 11px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #f57f24, #db5226);
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .ec-pay-pill {
          margin-top: 3px;
          border: 1px solid #ecd8c4;
          border-radius: 999px;
          padding: 7px 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6a594b;
          background: #fffaf4;
          font-size: 13px;
          font-weight: 700;
        }

        .spin {
          animation: spin 0.8s linear infinite;
          color: #ef6f23;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};