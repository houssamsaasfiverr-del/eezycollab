// src/components/PricingCard.tsx - BOLT-STYLE PRICING CARD WITH TIER DROPDOWN
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, Zap, Loader2, ChevronDown } from 'lucide-react';
import {
    CREDIT_PACKAGES,
    CreditPackage,
    formatPrice,
    calculateYearlySavings,
    PRO_PLAN
} from '../types/plans';
import { redirectToCheckout } from '../services/paymentservice';

interface PricingCardProps {
    onClose?: () => void;
    showFreeOption?: boolean;
}

export default function PricingCard({ onClose, showFreeOption = false }: PricingCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(
        CREDIT_PACKAGES.find(pkg => pkg.popular) || CREDIT_PACKAGES[1]
    );
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const currentPrice = billingPeriod === 'yearly'
        ? selectedPackage.yearlyPrice
        : selectedPackage.monthlyPrice;

    const yearlySavings = calculateYearlySavings(
        selectedPackage.monthlyPrice,
        selectedPackage.yearlyPrice
    );

    const handleSubscribe = async () => {
        if (!user) {
            navigate('/signup');
            return;
        }

        setLoading(true);
        try {
            await redirectToCheckout({
                userId: user.uid,
                email: user.email || '',
                packageId: selectedPackage.id,
                billingPeriod
            });
        } catch (error: any) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + (error.message || 'Please try again'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-card-container">
            {/* Billing Toggle */}
            <div className="billing-toggle">
                <span className={`toggle-label ${billingPeriod === 'monthly' ? 'active' : ''}`}>
                    Monthly
                </span>
                <button
                    className="toggle-switch"
                    onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                >
                    <span className={`toggle-dot ${billingPeriod === 'yearly' ? 'right' : ''}`} />
                </button>
                <span className={`toggle-label ${billingPeriod === 'yearly' ? 'active' : ''}`}>
                    Yearly
                    <span className="savings-badge">Save {yearlySavings}%</span>
                </span>
            </div>

            {/* Main Card */}
            <div className="pricing-main-card">
                <div className="card-header">
                    <div className="popular-badge">POPULAR</div>
                    <h3>Pro</h3>
                    <div className="price-display">
                        <span className="price-amount">{formatPrice(currentPrice)}</span>
                        <span className="price-period">
                            {billingPeriod === 'monthly' ? '/month' : '/year'}
                        </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                        <p className="price-note">
                            {formatPrice(Math.round(selectedPackage.yearlyPrice / 12))}/month billed yearly
                        </p>
                    )}
                </div>

                {/* Package Dropdown */}
                <div className="package-selector">
                    <label>Monthly prompts</label>
                    <div className="dropdown-container">
                        <button
                            className="dropdown-trigger"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <Zap className="w-4 h-4" />
                            <span>{selectedPackage.prompts} prompts</span>
                            <span className="dropdown-price">{formatPrice(currentPrice)}</span>
                            <ChevronDown className={`w-4 h-4 ${dropdownOpen ? 'rotated' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                {CREDIT_PACKAGES.map((pkg) => (
                                    <button
                                        key={pkg.id}
                                        className={`dropdown-item ${selectedPackage.id === pkg.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedPackage(pkg);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <span>{pkg.prompts} prompts</span>
                                        <span className="item-price">
                                            {formatPrice(billingPeriod === 'yearly' ? pkg.yearlyPrice : pkg.monthlyPrice)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features List */}
                <ul className="features-list">
                    {PRO_PLAN.features.map((feature, i) => (
                        <li key={i}>
                            <Check className="w-4 h-4 check-icon" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <button
                    className="subscribe-btn"
                    onClick={handleSubscribe}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>Get Pro</>
                    )}
                </button>

                {showFreeOption && (
                    <button
                        className="continue-free-btn"
                        onClick={onClose}
                    >
                        Continue with Free (1 prompt)
                    </button>
                )}
            </div>

            <style>{`
        .pricing-card-container {
          width: 100%;
          max-width: 400px;
        }

        .billing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: #71717a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-label.active {
          color: #fff;
        }

        .toggle-switch {
          width: 48px;
          height: 26px;
          background: #27272a;
          border: 1px solid #3f3f46;
          border-radius: 13px;
          padding: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-dot {
          display: block;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle-dot.right {
          transform: translateX(22px);
        }

        .savings-badge {
          font-size: 11px;
          font-weight: 600;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .pricing-main-card {
          background: #18181b;
          border: 2px solid #f97316;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 0 40px rgba(249, 115, 22, 0.15);
        }

        .card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .popular-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .card-header h3 {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 16px 0;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .price-amount {
          font-size: 48px;
          font-weight: 800;
          color: #fff;
        }

        .price-period {
          font-size: 16px;
          color: #71717a;
        }

        .price-note {
          font-size: 13px;
          color: #71717a;
          margin-top: 4px;
        }

        .package-selector {
          margin-bottom: 24px;
        }

        .package-selector label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: #27272a;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-trigger:hover {
          border-color: #f97316;
        }

        .dropdown-trigger svg {
          color: #f97316;
        }

        .dropdown-trigger svg.rotated {
          transform: rotate(180deg);
        }

        .dropdown-price {
          margin-left: auto;
          color: #f97316;
          font-weight: 600;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #27272a;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          padding: 8px;
          z-index: 50;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .dropdown-item:hover {
          background: #3f3f46;
        }

        .dropdown-item.active {
          background: rgba(249, 115, 22, 0.2);
        }

        .item-price {
          color: #f97316;
          font-weight: 600;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          color: #a1a1aa;
          font-size: 14px;
          border-bottom: 1px solid #27272a;
        }

        .features-list li:last-child {
          border-bottom: none;
        }

        .check-icon {
          color: #22c55e;
          flex-shrink: 0;
        }

        .subscribe-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .subscribe-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
        }

        .subscribe-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .continue-free-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: transparent;
          border: 1px solid #3f3f46;
          border-radius: 10px;
          color: #71717a;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-free-btn:hover {
          border-color: #52525b;
          color: #a1a1aa;
        }
      `}</style>
        </div>
    );
}
