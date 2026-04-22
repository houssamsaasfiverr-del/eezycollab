// src/services/paymentService.ts - UPDATED FOR STRIPE

import { CREDIT_PACKAGES, CreditPackage, formatPrice } from '../types/plans';

export interface CheckoutOptions {
  userId: string;
  email: string;
  packageId: string;
  billingPeriod: 'monthly' | 'yearly';
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

// Create Stripe checkout session
export async function createCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
  const { userId, email, packageId, billingPeriod } = options;

  // Find the selected package
  const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
  if (!selectedPackage) {
    throw new Error('Invalid package selected');
  }

  const amount = billingPeriod === 'yearly'
    ? selectedPackage.yearlyPrice
    : selectedPackage.monthlyPrice;

  console.log('💳 Creating Stripe checkout:', {
    userId,
    email,
    packageId,
    credits: selectedPackage.credits,
    amount: formatPrice(amount),
    billingPeriod
  });

  try {
    const response = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        email,
        packageId,
        credits: selectedPackage.credits,
        amount,
        billingPeriod,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Checkout creation failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Checkout session created:', data.sessionId);

    return {
      sessionId: data.sessionId,
      url: data.url
    };

  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    throw error;
  }
}

// Redirect to Stripe checkout
export async function redirectToCheckout(options: CheckoutOptions): Promise<void> {
  try {
    const { url } = await createCheckout(options);

    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('❌ Redirect error:', error);
    throw error;
  }
}

// Verify payment session
export async function verifyPayment(sessionId: string): Promise<any> {
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
}

// Get package by ID helper
export function getPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
}

// Get all packages
export function getAllPackages(): CreditPackage[] {
  return CREDIT_PACKAGES;
}

// Get popular package
export function getPopularPackage(): CreditPackage {
  return CREDIT_PACKAGES.find(pkg => pkg.popular) || CREDIT_PACKAGES[1];
}

// Legacy function for backward compatibility
export const createPayment = async (
  userId: string,
  email: string,
  details: {
    amount: number;
    currency: string;
    planName: string;
    planType: 'free' | 'pro';
    billingPeriod: 'monthly' | 'yearly';
    credits?: number;
  }
): Promise<{ id: string; url: string; status: string }> => {
  // Map old format to new format
  const packageId = CREDIT_PACKAGES.find(pkg =>
    (details.billingPeriod === 'yearly' ? pkg.yearlyPrice : pkg.monthlyPrice) === details.amount
  )?.id || 'basic_50';

  const result = await createCheckout({
    userId,
    email,
    packageId,
    billingPeriod: details.billingPeriod
  });

  return {
    id: result.sessionId,
    url: result.url,
    status: 'pending'
  };
};
