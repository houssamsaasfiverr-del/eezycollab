// src/components/BuyCreditsModal.tsx - MODAL TO PROMPT UPGRADE AFTER FREE TRIAL
import { X, Zap, Crown, ArrowRight } from 'lucide-react';
import PricingCard from './PricingCard';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining?: number;
  hasUsedFreeTrial?: boolean;
}

export default function BuyCreditsModal({
  isOpen,
  onClose,
  hasUsedFreeTrial = false
}: BuyCreditsModalProps) {
  if (!isOpen) return null;

  const title = hasUsedFreeTrial
    ? "You've used your free trial!"
    : "Out of credits";
  const subtitle = hasUsedFreeTrial
    ? "Unlock unlimited AI-powered extension building"
    : "Purchase more credits to continue building";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon">
            {hasUsedFreeTrial ? <Crown className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* Pricing Card */}
        <div className="modal-content">
          <PricingCard onClose={onClose} showFreeOption={false} />
        </div>

        {/* Benefits Preview */}
        <div className="modal-benefits">
          <div className="benefit-item">
            <ArrowRight className="w-4 h-4" />
            <span>Instant credit activation</span>
          </div>
          <div className="benefit-item">
            <ArrowRight className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="benefit-item">
            <ArrowRight className="w-4 h-4" />
            <span>Secure payment via Stripe</span>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          background: #0a0a0a;
          border: 1px solid #27272a;
          border-radius: 24px;
          padding: 32px;
          animation: modalSlideUp 0.3s ease;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #27272a;
          border: none;
          border-radius: 50%;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #3f3f46;
          color: #fff;
        }

        .modal-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .modal-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.1));
          border-radius: 16px;
          color: #f97316;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .modal-header p {
          font-size: 15px;
          color: #71717a;
          margin: 0;
        }

        .modal-content {
          margin-bottom: 24px;
        }

        .modal-benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #52525b;
        }

        .benefit-item svg {
          color: #22c55e;
        }

        /* Scrollbar styling */
        .modal-container::-webkit-scrollbar {
          width: 6px;
        }

        .modal-container::-webkit-scrollbar-track {
          background: #18181b;
        }

        .modal-container::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
