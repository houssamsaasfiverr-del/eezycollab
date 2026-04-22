// src/components/GlobalSidebar.tsx - GLOBAL LEFT SIDEBAR

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, User, History, Settings, LogOut, 
  Menu, Folder, Clock, Plus, ChevronLeft,
  Zap, Crown
} from 'lucide-react';
import { getUserCredits, UserCredits } from '../methods/services/CreditService';
import { supabase } from '../lib/supabaseClient';

interface GlobalSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getUserCredits(user.uid).then(setCredits);
      // Load history from localStorage
      const savedHistory = localStorage.getItem('projectHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`global-sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">E</div>
            {isOpen && <span className="brand-name">CollabFree</span>}
          </div>
          {isOpen && (
            <button onClick={onToggle} className="close-btn">
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {isOpen ? (
          <>
            {/* Profile Section */}
            {user && (
              <div className="profile-section">
                <div className="profile-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <div className="profile-name">{user.displayName || 'User'}</div>
                  <div className="profile-email">{user.email}</div>
                  {credits && (
                    <div className="profile-credits">
                      <Zap size={12} />
                      <span>{credits.credits} credits</span>
                      {credits.plan === 'pro' && <Crown size={12} className="pro-icon" />}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
              <button
                onClick={() => navigate('/')}
                className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>Home</span>
              </button>

              {user && (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  >
                    <User size={18} />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => navigate('/builder')}
                    className="nav-item nav-item-primary"
                  >
                    <Plus size={18} />
                    <span>New Project</span>
                  </button>
                </>
              )}
            </nav>

            {/* History Section */}
            {user && (
              <div className="history-section">
                <div className="section-header">
                  <History size={16} />
                  <span>Recent Projects</span>
                </div>
                <div className="history-list">
                  {history.length === 0 ? (
                    <div className="history-empty">
                      <p>No projects yet</p>
                      <button 
                        onClick={() => navigate('/builder')}
                        className="create-first-btn"
                      >
                        Create your first project
                      </button>
                    </div>
                  ) : (
                    history.slice(0, 10).map((project, idx) => (
                      <div
                        key={idx}
                        className="history-item"
                        onClick={() => navigate(`/builder?project=${project.id}`)}
                      >
                        <Folder size={14} />
                        <div className="history-item-info">
                          <div className="history-item-name">{project.name}</div>
                          <div className="history-item-time">
                            <Clock size={10} />
                            {new Date(project.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="sidebar-bottom">
              {user ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bottom-btn"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="bottom-btn logout-btn"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => navigate('/signup')}
                  className="bottom-btn login-btn"
                >
                  <User size={18} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </>
        ) : (
          // Collapsed state
          <div className="sidebar-collapsed">
            <button onClick={onToggle} className="expand-btn">
              <Menu size={20} />
            </button>
          </div>
        )}
      </aside>

      <style>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block;
          }
        }

        .global-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: #1a1f26;
          border-right: 1px solid #2d3748;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 999;
        }

        .global-sidebar.closed {
          transform: translateX(-100%);
        }

        @media (max-width: 768px) {
          .global-sidebar {
            width: 280px;
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #2d3748;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
          color: white;
        }

        .brand-name {
          font-weight: 800;
          font-size: 16px;
          color: #fff;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #2d3748;
          color: #fff;
        }

        .profile-section {
          padding: 20px;
          border-bottom: 1px solid #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: white;
        }

        .profile-info {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-email {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-credits {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 12px;
          color: #fbbf24;
          font-weight: 600;
        }

        .pro-icon {
          color: #f59e0b;
        }

        .sidebar-nav {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-bottom: 1px solid #2d3748;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #9ca3af;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
        }

        .nav-item:hover {
          background: #2d3748;
          color: #fff;
        }

        .nav-item.active {
          background: #374151;
          color: #fff;
        }

        .nav-item-primary {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .nav-item-primary:hover {
          background: #2563eb;
        }

        .history-section {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 12px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          text-align: center;
          color: #6b7280;
          padding: 20px;
        }

        .history-empty p {
          font-size: 13px;
        }

        .create-first-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-first-btn:hover {
          background: #2563eb;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-item:hover {
          background: #2d3748;
        }

        .history-item-info {
          flex: 1;
          min-width: 0;
        }

        .history-item-name {
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-item-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }

        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid #2d3748;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bottom-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #9ca3af;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          text-align: left;
        }

        .bottom-btn:hover {
          background: #2d3748;
          color: #fff;
        }

        .logout-btn:hover {
          background: #dc2626;
          color: white;
        }

        .login-btn {
          background: #3b82f6;
          color: white;
          font-weight: 600;
          justify-content: center;
        }

        .login-btn:hover {
          background: #2563eb;
        }

        .sidebar-collapsed {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
        }

        .expand-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 10px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .expand-btn:hover {
          background: #2d3748;
          color: #fff;
        }

        /* Scrollbar */
        .history-list::-webkit-scrollbar {
          width: 6px;
        }

        .history-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .history-list::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }

        .history-list::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </>
  );
};
