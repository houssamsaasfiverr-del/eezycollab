// src/components/FloatingProfile.tsx - FINAL VERSION WITH FIRESTORE

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, History, Settings, LogOut,
  Folder, Clock, Zap, Crown, Plus
} from 'lucide-react';
import { getUserCredits, UserCredits } from '../methods/services/CreditService';
import { supabase } from '../lib/supabaseClient';

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const FloatingProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load credits
  useEffect(() => {
    if (user) {
      getUserCredits(user.uid).then(setCredits);
    }
  }, [user]);

  // Load user-specific project history from Supabase
  useEffect(() => {
    const loadUserProjects = async () => {
      if (!user) return;

      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.uid)
          .order('last_modified', { ascending: false })
          .limit(10);

        if (error) throw error;

        const projects = (data || []).map((project) => ({
          id: project.id,
          name: project.name,
          lastModified: project.last_modified,
          ...project
        }));

        setHistory(projects);
        console.log('✅ Loaded user projects:', projects.length);
      } catch (error) {
        console.error('❌ Error loading projects:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user) {
      loadUserProjects();
    }
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      navigate('/');
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Circle Avatar */}
      <div
        className="floating-profile-trigger"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="trigger-avatar" />
        ) : (
          <div className="trigger-avatar-placeholder">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
        {credits?.plan === 'pro' && (
          <div className="pro-badge-trigger">
            <Crown size={10} />
          </div>
        )}
      </div>

      {/* Sidebar Panel */}
      <div
        className={`floating-profile-panel ${isOpen ? 'open' : ''}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Profile Header */}
        <div className="profile-header-fp">
          <div className="profile-avatar-large-fp">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <div className="avatar-placeholder-large-fp">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-details-fp">
            <div className="profile-name-fp">{user.displayName || 'User'}</div>
            <div className="profile-email-fp">{user.email}</div>
            {credits && (
              <>
                <div className="profile-credits-badge-fp">
                  <Zap size={12} />
                  <span>{credits.credits}/{credits.maxCredits}</span>
                  {credits.plan === 'pro' && (
                    <span className="pro-label-fp">
                      {credits.billingPeriod === 'yearly' ? 'PRO YEARLY' : 'PRO MONTHLY'}
                    </span>
                  )}
                </div>

                {/* Expiration Date Display */}
                {credits.nextResetDate && (
                  <div className="expiration-info-fp">
                    <Clock size={10} />
                    <span>
                      {credits.plan === 'pro'
                        ? `Renews ${formatDate(credits.nextResetDate)}`
                        : `Resets ${formatDate(credits.nextResetDate)}`
                      }
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-fp">
          <button
            onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
            className="action-btn-fp"
          >
            <Home size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { navigate('/builder'); setIsOpen(false); }}
            className="action-btn-fp action-btn-primary-fp"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>

        {/* Recent History */}
        <div className="history-section-fp">
          <div className="section-title-fp">
            <History size={14} />
            <span>Recent Projects</span>
          </div>
          <div className="history-items-fp">
            {loadingHistory ? (
              <div className="history-loading-fp">
                <div className="spinner-fp"></div>
                <p>Loading projects...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="history-empty-fp">
                <p>No projects yet</p>
                <button
                  onClick={() => { navigate('/builder'); setIsOpen(false); }}
                  className="create-btn-small-fp"
                >
                  Create first project
                </button>
              </div>
            ) : (
              history.map((project) => (
                <div
                  key={project.id}
                  className="history-item-fp"
                  onClick={() => {
                    navigate(`/builder?project=${project.id}`);
                    setIsOpen(false);
                  }}
                >
                  <Folder size={14} />
                  <div className="history-info-fp">
                    <div className="history-name-fp">{project.name}</div>
                    <div className="history-date-fp">
                      <Clock size={10} />
                      {new Date(project.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bottom-actions-fp">
          <button
            onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
            className="bottom-btn-fp"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="bottom-btn-fp logout-btn-fp"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        .floating-profile-trigger {
          position: fixed;
          left: 24px;
          bottom: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          border: 2px solid #fff;
        }

        .floating-profile-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .trigger-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .trigger-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: white;
        }

        .pro-badge-trigger {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
        }

        .floating-profile-panel {
          position: fixed;
          left: 24px;
          bottom: 84px;
          width: 320px;
          max-height: calc(100vh - 120px);
          background: #1a1f26;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          transform: translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
          display: flex;
          flex-direction: column;
          color: #e5e7eb;
          border: 1px solid #2d3748;
        }

        .floating-profile-panel.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        .profile-header-fp {
          padding: 20px;
          border-bottom: 1px solid #2d3748;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .profile-avatar-large-fp {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .profile-avatar-large-fp img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder-large-fp {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
          color: white;
        }

        .profile-details-fp {
          flex: 1;
          min-width: 0;
        }

        .profile-name-fp {
          font-weight: 700;
          font-size: 15px;
          color: #fff;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-email-fp {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }

        .profile-credits-badge-fp {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #2d3748;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #fbbf24;
        }

        .pro-label-fp {
          background: #fbbf24;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
        }

        .expiration-info-fp {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          padding: 4px 8px;
          background: #374151;
          border-radius: 6px;
          font-size: 11px;
          color: #9ca3af;
        }

        .expiration-info-fp span {
          font-weight: 500;
        }

        .quick-actions-fp {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px solid #2d3748;
        }

        .action-btn-fp {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: 1px solid #2d3748;
          color: #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
        }

        .action-btn-fp:hover {
          background: #2d3748;
          border-color: #374151;
        }

        .action-btn-primary-fp {
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-color: #f97316;
          color: white;
        }

        .action-btn-primary-fp:hover {
          background: linear-gradient(135deg, #ea580c, #dc2626);
          border-color: #ea580c;
        }

        .history-section-fp {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px;
        }

        .section-title-fp {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .history-items-fp {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .history-loading-fp {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100px;
          gap: 12px;
          color: #6b7280;
        }

        .spinner-fp {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #f97316;
          border-radius: 50%;
          animation: spin-fp 0.8s linear infinite;
        }

        @keyframes spin-fp {
          to { transform: rotate(360deg); }
        }

        .history-loading-fp p {
          font-size: 12px;
        }

        .history-empty-fp {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          text-align: center;
          color: #6b7280;
        }

        .history-empty-fp p {
          font-size: 13px;
        }

        .create-btn-small-fp {
          padding: 8px 14px;
          background: #f97316;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-btn-small-fp:hover {
          background: #ea580c;
        }

        .history-item-fp {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .history-item-fp:hover {
          background: #2d3748;
          border-color: #374151;
        }

        .history-info-fp {
          flex: 1;
          min-width: 0;
        }

        .history-name-fp {
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }

        .history-date-fp {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .bottom-actions-fp {
          padding: 12px;
          border-top: 1px solid #2d3748;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bottom-btn-fp {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: 1px solid #2d3748;
          color: #9ca3af;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .bottom-btn-fp:hover {
          background: #2d3748;
          color: #fff;
          border-color: #374151;
        }

        .logout-btn-fp:hover {
          background: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .history-items-fp::-webkit-scrollbar {
          width: 4px;
        }

        .history-items-fp::-webkit-scrollbar-track {
          background: transparent;
        }

        .history-items-fp::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }

        @media (max-width: 768px) {
          .floating-profile-trigger {
            left: 16px;
            bottom: 16px;
            width: 44px;
            height: 44px;
          }

          .floating-profile-panel {
            left: 16px;
            bottom: 72px;
            width: 300px;
          }
        }
      `}</style>
    </>
  );
};
