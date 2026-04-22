// src/components/CreditsDisplay.tsx - COMPLETE FIXED VERSION

import React from 'react';
import { Zap, Calendar, CreditCard } from 'lucide-react';

interface CreditsDisplayProps {
  credits: number;
  maxCredits: number;
  plan: 'free' | 'basic' | 'pro';
  subscriptionDate?: string;
  billingPeriod?: 'monthly' | 'yearly';
  nextRenewalDate?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  credits, 
  maxCredits, 
  plan,
  subscriptionDate,
  billingPeriod = 'monthly',
  nextRenewalDate
}) => {
  const percentage = (credits / maxCredits) * 100;
  
  const getColor = () => {
    if (percentage > 50) return 'from-green-500 to-emerald-600';
    if (percentage > 20) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getPlanColor = () => {
    if (plan === 'pro') return 'from-purple-500 to-indigo-600';
    if (plan === 'basic') return 'from-pink-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  const getPlanBadgeColor = () => {
    if (plan === 'pro') return 'bg-gradient-to-r from-purple-600 to-indigo-600';
    if (plan === 'basic') return 'bg-gradient-to-r from-pink-600 to-rose-600';
    return 'bg-gradient-to-r from-gray-600 to-slate-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const calculateNextRenewal = () => {
    if (nextRenewalDate) return formatDate(nextRenewalDate);
    if (!subscriptionDate) return 'N/A';
    
    const date = new Date(subscriptionDate);
    date.setMonth(date.getMonth() + 1);
    return formatDate(date.toISOString());
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getPlanColor()} flex items-center justify-center shadow-lg`}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-gray-900 capitalize">{plan} Plan</h3>
              <span className={`${getPlanBadgeColor()} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md`}>
                {plan === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Monthly Credits</p>
          </div>
        </div>
        {plan === 'free' && (
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
            Free mode
          </span>
        )}
      </div>

      {/* Credits Progress */}
      <div className="space-y-4 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {credits}
            </span>
            <span className="text-2xl font-bold text-gray-400 ml-2">/ {maxCredits}</span>
          </div>
          <span className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {percentage.toFixed(0)}% remaining
          </span>
        </div>
        
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getColor()} transition-all duration-700 rounded-full shadow-lg`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-xs font-semibold text-gray-500 text-center">
          {credits} credits available for generating extensions
        </p>
      </div>

      {/* Subscription Info for Pro/Basic Users */}
      {plan !== 'free' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Billing:</span>
              <span className="font-bold text-gray-900 capitalize">{billingPeriod}</span>
            </div>
            {subscriptionDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Active since:</span>
                <span className="font-bold text-gray-900">{formatDate(subscriptionDate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Next renewal:</span>
              <span className="font-bold text-green-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {calculateNextRenewal()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-600 font-medium">Credits reset:</span>
              <span className="font-bold text-blue-600">{calculateNextRenewal()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {credits === 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 shadow-md">
          <p className="text-sm font-bold text-red-700 flex items-center gap-2 mb-1">
            ⚠️ No Credits Remaining!
          </p>
          <p className="text-xs font-medium text-red-600">
            {plan === 'free' 
              ? 'Please wait for monthly reset to continue.'
              : `Your ${maxCredits} credits will reset on ${calculateNextRenewal()}`}
          </p>
        </div>
      )}
      
      {credits > 0 && credits <= maxCredits * 0.2 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 shadow-md">
          <p className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-1">
            ⚡ Running Low on Credits!
          </p>
          <p className="text-xs font-medium text-yellow-700">
            You have {credits} credits left. 
            {plan === 'free' && ' Continue your work and top up later if needed.'}
          </p>
        </div>
      )}
    </div>
  );
};
