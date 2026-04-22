// src/types/plans.ts - UPDATED CREDIT-BASED PRICING SYSTEM

export type PlanType = 'free' | 'pro';
export type BillingPeriod = 'monthly' | 'yearly';

// Credits per prompt - core constant
export const CREDITS_PER_PROMPT = 3;

// Credit packages available for purchase (Bolt-style tiered pricing)
export interface CreditPackage {
  id: string;
  credits: number;
  prompts: number;
  monthlyPrice: number;  // In cents (USD)
  yearlyPrice: number;   // In cents (USD) - 10% discount
  label: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter_25',
    credits: 75,
    prompts: 25,
    monthlyPrice: 500,  // $5
    yearlyPrice: 5400,  // $54/year ($4.50/mo - 10% off)
    label: '25 prompts'
  },
  {
    id: 'basic_50',
    credits: 150,
    prompts: 50,
    monthlyPrice: 1000,  // $10
    yearlyPrice: 10800,  // $108/year
    label: '50 prompts',
    popular: true
  },
  {
    id: 'pro_100',
    credits: 300,
    prompts: 100,
    monthlyPrice: 2000,  // $20
    yearlyPrice: 21600,  // $216/year
    label: '100 prompts'
  },
  {
    id: 'business_200',
    credits: 600,
    prompts: 200,
    monthlyPrice: 3500,  // $35
    yearlyPrice: 37800,  // $378/year
    label: '200 prompts'
  },
  {
    id: 'enterprise_500',
    credits: 1500,
    prompts: 500,
    monthlyPrice: 7500,  // $75
    yearlyPrice: 81000,  // $810/year
    label: '500 prompts'
  },
  {
    id: 'unlimited_1000',
    credits: 3000,
    prompts: 1000,
    monthlyPrice: 10000,  // $100
    yearlyPrice: 108000,  // $1080/year
    label: '1000 prompts'
  }
];

// Plan definitions
export interface PlanDetails {
  type: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  prompts: number;
  features: string[];
}

// Free plan - only 1 prompt (3 credits)
export const FREE_PLAN: PlanDetails = {
  type: 'free',
  name: 'Free',
  monthlyPrice: 0,
  yearlyPrice: 0,
  credits: 3,  // Only 1 prompt worth
  prompts: 1,
  features: [
    '1 free extension generation',
    'All browsers supported',
    'Code export & download',
    'Basic templates',
    'Community support'
  ]
};

// Pro plan - default to 50 prompts package
export const PRO_PLAN: PlanDetails = {
  type: 'pro',
  name: 'Pro',
  monthlyPrice: 1000,  // $10 default
  yearlyPrice: 10800,
  credits: 150,
  prompts: 50,
  features: [
    'Up to 1000 prompts/month',
    'Unlimited daily generations',
    'Code editing access',
    'Priority AI models',
    'Project history & saves',
    'Priority support',
    'Early access to features'
  ]
};

// Legacy exports for backward compatibility
export const PLAN_CREDITS = {
  free: 3,
  pro: 150
} as const;

export const DEFAULT_PLAN = FREE_PLAN;

// Helper functions
export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === id);
}

export function getDefaultPackage(): CreditPackage {
  return CREDIT_PACKAGES.find(pkg => pkg.popular) || CREDIT_PACKAGES[0];
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
}