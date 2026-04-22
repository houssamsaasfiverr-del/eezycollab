export interface StripeConfig {
  publishableKey: string;
  proPriceId: string;
  enterprisePriceId: string;
}

export class StripeService {
  private config: StripeConfig | null = null;

  initialize(config: StripeConfig) {
    this.config = config;
  }

  async createCheckoutSession(plan: 'pro' | 'enterprise', userId: string): Promise<string> {
    if (!this.config) {
      throw new Error('Stripe not configured. Please add your Stripe keys.');
    }

    const priceId = plan === 'pro' ? this.config.proPriceId : this.config.enterprisePriceId;

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      return sessionId;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new Error('Failed to initiate payment. Please try again.');
    }
  }

  async createCustomerPortalSession(customerId: string): Promise<string> {
    if (!this.config) {
      throw new Error('Stripe not configured');
    }

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Stripe portal error:', error);
      throw new Error('Failed to open billing portal');
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

export const stripeService = new StripeService();
