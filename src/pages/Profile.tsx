import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Crown,
  Mail,
  Sparkles,
  User,
  Wallet,
  CreditCard,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

interface UserData {
  email?: string;
  displayName?: string;
  plan: "free" | "pro";
  credits: number;
  maxCredits: number;
  dailyCreditsUsed?: number;
  dailyLimit?: number;
  createdAt?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const hydrate = async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.uid)
        .maybeSingle();

      if (data) {
        setUserData({
          email: data.email || user.email || "",
          displayName: data.display_name || user.displayName || "Creator team",
          plan: data.plan || "free",
          credits: data.credits_remaining || data.credits || 0,
          maxCredits: data.max_credits || data.total_credits || 0,
          dailyCreditsUsed: data.daily_credits_used || 0,
          dailyLimit: data.daily_limit || 5,
          createdAt: data.created_at,
        });
      }
      setLoading(false);
    };

    void hydrate();
  }, [navigate, user]);

  if (loading || !userData) {
    return (
      <div className="profile-loading">
        <Sparkles className="spin" size={22} />
        <span>Loading profile...</span>
        <style>{`
          .profile-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #fdf8f1;
            color: #4b3a2f;
            font-family: "Manrope", "Segoe UI", sans-serif;
          }
          .spin { animation: spin 0.9s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const isPro = userData.plan === "pro";
  const joinedDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const creditsPercent =
    userData.maxCredits > 0
      ? Math.min(100, (userData.credits / userData.maxCredits) * 100)
      : 0;

  const dailyRemaining = Math.max(
    0,
    (userData.dailyLimit || 5) - (userData.dailyCreditsUsed || 0),
  );

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="profile-header">
          <div className="profile-avatar">
            <User size={40} />
          </div>
          <div className="profile-header-info">
            <h1>{userData.displayName}</h1>
            <p>{userData.email}</p>
          </div>
          <div className="profile-badge">
            <Crown size={16} />
            {isPro ? "Pro Plan" : "Free Plan"}
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-card">
            <div className="card-header">
              <Wallet size={20} />
              <h2>Subscription Usage</h2>
            </div>
            <div className="usage-stats">
              <div className="usage-main">
                <span className="usage-label">Credits Remaining</span>
                <strong className="usage-value">
                  {userData.credits} / {userData.maxCredits}
                </strong>
              </div>
              <div className="usage-bar">
                <div
                  className="usage-progress"
                  style={{ width: `${creditsPercent}%` }}
                />
              </div>
              {!isPro && (
                <div className="usage-daily">
                  <span>{dailyRemaining} prompts remaining today</span>
                  <small>
                    {userData.dailyCreditsUsed || 0} / {userData.dailyLimit || 5}{" "}
                    used
                  </small>
                </div>
              )}
            </div>
          </section>

          <section className="profile-card">
            <div className="card-header">
              <User size={20} />
              <h2>Account Information</h2>
            </div>
            <div className="info-rows">
              <div className="info-row">
                <div className="info-label">
                  <Mail size={16} />
                  Email
                </div>
                <span className="info-value">{userData.email}</span>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <User size={16} />
                  Display Name
                </div>
                <span className="info-value">{userData.displayName}</span>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <Calendar size={16} />
                  Member Since
                </div>
                <span className="info-value">{joinedDate}</span>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="card-header">
              <CreditCard size={20} />
              <h2>Plan Details</h2>
            </div>
            <div className="plan-details">
              <div className="plan-badge-large">
                <Crown size={24} />
                <div>
                  <strong>{isPro ? "Pro Plan" : "Free Plan"}</strong>
                  <p>{isPro ? "All features unlocked" : "Basic features"}</p>
                </div>
              </div>
              <div className="plan-features">
                <div className="feature-item">
                  <Shield size={16} />
                  <span>Monthly Credits: {userData.maxCredits}</span>
                </div>
                <div className="feature-item">
                  <Sparkles size={16} />
                  <span>
                    Daily Prompts: {isPro ? "Unlimited" : userData.dailyLimit}
                  </span>
                </div>
                <div className="feature-item">
                  <Calendar size={16} />
                  <span>Billing: Monthly</span>
                </div>
              </div>
              {!isPro && (
                <button
                  className="upgrade-btn"
                  onClick={() => navigate("/pricing")}
                >
                  <Crown size={16} />
                  Upgrade to Pro
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .profile-page {
          min-height: 100vh;
          background: linear-gradient(140deg, #fffaf4, #fff5eb 40%, #fff);
          padding: 40px 20px;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .profile-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .back-btn {
          border: 1px solid #f2deca;
          background: #fff;
          border-radius: 12px;
          padding: 10px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6d584b;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          border-color: #e8d0b8;
          background: #fffbf7;
        }

        .profile-header {
          background: #fff;
          border: 1px solid #f2dfce;
          border-radius: 20px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(197, 149, 106, 0.12);
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .profile-header-info {
          flex: 1;
        }

        .profile-header-info h1 {
          margin: 0 0 6px 0;
          font-size: 28px;
          font-weight: 900;
          color: #2b221d;
          letter-spacing: -0.02em;
        }

        .profile-header-info p {
          margin: 0;
          color: #7b6556;
          font-size: 15px;
          font-weight: 600;
        }

        .profile-badge {
          background: linear-gradient(135deg, #fff8ef, #fff2e4);
          border: 1px solid #f2deca;
          border-radius: 12px;
          padding: 10px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #f47d21;
          font-weight: 800;
          font-size: 14px;
        }

        .profile-grid {
          display: grid;
          gap: 20px;
        }

        .profile-card {
          background: #fff;
          border: 1px solid #f2dfce;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(197, 149, 106, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #f47d21;
        }

        .card-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #2b221d;
        }

        .usage-stats {
          display: grid;
          gap: 16px;
        }

        .usage-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .usage-label {
          font-size: 13px;
          color: #786353;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .usage-value {
          font-size: 32px;
          font-weight: 900;
          color: #2b221d;
          letter-spacing: -0.02em;
        }

        .usage-bar {
          width: 100%;
          height: 12px;
          background: #f7eade;
          border-radius: 999px;
          overflow: hidden;
        }

        .usage-progress {
          height: 100%;
          background: linear-gradient(90deg, #f68a2d, #df5026);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .usage-daily {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: #fffbf7;
          border: 1px solid #f2e0d0;
          border-radius: 12px;
        }

        .usage-daily span {
          color: #2b221d;
          font-weight: 800;
          font-size: 14px;
        }

        .usage-daily small {
          color: #836d5f;
          font-size: 12px;
          font-weight: 600;
        }

        .info-rows {
          display: grid;
          gap: 12px;
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px;
          background: #fffbf7;
          border: 1px solid #f2e0d0;
          border-radius: 12px;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6f5b4d;
          font-weight: 700;
          font-size: 14px;
        }

        .info-value {
          color: #2b221d;
          font-weight: 800;
          font-size: 14px;
        }

        .plan-details {
          display: grid;
          gap: 20px;
        }

        .plan-badge-large {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #fff8ef, #fff2e4);
          border: 1px solid #f2deca;
          border-radius: 16px;
          color: #f47d21;
        }

        .plan-badge-large strong {
          display: block;
          font-size: 18px;
          font-weight: 900;
          color: #2b221d;
          margin-bottom: 4px;
        }

        .plan-badge-large p {
          margin: 0;
          color: #7b6556;
          font-size: 13px;
          font-weight: 600;
        }

        .plan-features {
          display: grid;
          gap: 10px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fffbf7;
          border: 1px solid #f2e0d0;
          border-radius: 10px;
          color: #6f5b4d;
          font-weight: 700;
          font-size: 14px;
        }

        .feature-item svg {
          color: #f47d21;
          flex-shrink: 0;
        }

        .upgrade-btn {
          border: 0;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
          border-radius: 14px;
          padding: 14px 20px;
          font-weight: 900;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(244, 125, 33, 0.3);
        }

        .upgrade-btn:hover {
          background: linear-gradient(135deg, #f68a2d, #e35828);
          box-shadow: 0 8px 20px rgba(244, 125, 33, 0.4);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .profile-header-info h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
