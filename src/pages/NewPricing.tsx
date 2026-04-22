// src/services/paymentService.ts

interface PaymentDetails {
  amount: number;
  currency: string;
  planName: string;
  planType: 'basic' | 'pro';
  billingPeriod: 'monthly' | 'yearly';
}

export const createPayment = async (
  userId: string,
  email: string,
  details: PaymentDetails
): Promise<any> => {
  
  console.log('💳 Creating payment:', {
    userId,
    email,
    amount: details.amount,
    plan: details.planType,
    period: details.billingPeriod
  });

  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        email,
        amount: details.amount,
        currency: details.currency,
        plan: details.planType,
        billingPeriod: details.billingPeriod
      })
    });

    const responseText = await response.text();
    console.log('Backend response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Payment creation failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Payment session created:', data);

    if (!data.checkout_url) {
      throw new Error('No checkout URL received');
    }

    return {
      id: data.session_id,
      url: data.checkout_url,
      status: 'pending'
    };

  } catch (error: any) {
    console.error('❌ Payment error:', error);
    throw error;
  }
};

export const verifyPayment = async (sessionId: string) => {
  console.log('🔍 Verifying payment:', sessionId);

  try {
    const response = await fetch(`/api/verify-payment?sessionId=${sessionId}`);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = JSON.parse(responseText);
    console.log('✅ Payment verified:', data);
    
    return data;

  } catch (error: any) {
    console.error('❌ Verification error:', error);
    throw error;
  }
};
