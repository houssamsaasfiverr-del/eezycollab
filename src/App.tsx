// src/App.tsx - CLEAN WITHOUT SIDEBAR
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NewLanding from "./pages/NewLanding";
import FeaturesPage from "./pages/FeaturesPage";
import WorkflowPage from "./pages/WorkflowPage";
import LandingPricingPage from "./pages/LandingPricingPage";
import ResourcesPage from "./pages/ResourcesPage";
import ContactPage from "./pages/ContactPage";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import CampaignInfluencers from "./pages/CampaignInfluencers";
import CampaignPlatforms from "./pages/CampaignPlatforms";
import CampaignRecent from "./pages/CampaignRecent";
import Profile from "./pages/Profile";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { Sparkles } from "lucide-react";

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-icon">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="loading-text">Preparing CollabFree...</div>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>

        <style>{`
          .app-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #fff2e4, #fffaf3);
          }

          .loading-content {
            text-align: center;
          }

          .loading-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            border-radius: 16px;
            color: white;
            animation: pulse 1.5s ease-in-out infinite;
          }

          .loading-text {
            font-size: 16px;
            font-weight: 600;
            color: #6f5d4e;
            margin-bottom: 24px;
          }

          .loading-bar {
            width: 200px;
            height: 4px;
            background: #f2e1cd;
            border-radius: 4px;
            overflow: hidden;
          }

          .loading-progress {
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #f97316, #de4f23, transparent);
            animation: loading 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<NewLanding />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/pricing" element={<LandingPricingPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard/campaigns/influencers"
        element={
          user ? <CampaignInfluencers /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/dashboard/campaigns/recent"
        element={user ? <CampaignRecent /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard/campaigns/platforms"
        element={
          user ? <CampaignPlatforms /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/builder"
        element={user ? <Builder /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/work/campaigns/create"
        element={user ? <Builder /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/work/emailSequence"
        element={
          user ? (
            <Navigate to="/builder?step=4" replace />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />
      <Route
        path="/work/campaigns/chat"
        element={
          user ? (
            <Navigate to="/dashboard?section=inbox" replace />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
