import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LandingShellProps {
  children: ReactNode;
  activePath?: string;
}

const navItems = [
  { label: 'Features', path: '/features' },
  { label: 'Workflow', path: '/workflow' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Resources', path: '/resources' },
  { label: 'Contact', path: '/contact' }
];

export default function LandingShell({ children, activePath }: LandingShellProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="ls-root">
      <header className="ls-header">
        <div className="ls-header-inner">
          <button className="ls-logo" onClick={() => navigate('/')}>
            <Sparkles size={18} />
            <span>CollabFree</span>
          </button>

          <nav className="ls-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={activePath === item.path ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ls-actions">
            {!user && (
              <button className="ls-btn ghost" onClick={() => navigate('/login')}>
                Log in
              </button>
            )}
            <button className="ls-btn solid" onClick={() => navigate(user ? '/dashboard' : '/signup')}>
              {user ? 'Open App' : 'Start Free'}
            </button>
          </div>

          <button className="ls-mobile-toggle" onClick={() => setMobileOpen((prev) => !prev)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="ls-mobile-menu">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="ls-footer">
        <div className="ls-footer-inner">
          <div className="ls-footer-brand">
            <h4>CollabFree</h4>
            <p>Campaign operating system for creator outreach teams.</p>
            <small>Built for modern influencer growth teams.</small>
          </div>

          <div className="ls-footer-columns">
            <div className="ls-footer-col">
              <span>Product</span>
              <Link to="/features">Features</Link>
              <Link to="/workflow">Workflow</Link>
              <Link to="/pricing">Pricing</Link>
            </div>

            <div className="ls-footer-col">
              <span>Resources</span>
              <Link to="/resources">Guides</Link>
              <Link to="/contact">Support</Link>
              <Link to={user ? '/dashboard' : '/signup'}>{user ? 'Open App' : 'Start Free'}</Link>
            </div>

            <div className="ls-footer-col">
              <span>Company</span>
              <a href="mailto:hello@collabfree.com">hello@collabfree.com</a>
              <a href="tel:+10000000000">+1 (000) 000-0000</a>
              <span className="legal">2026 CollabFree. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .ls-root {
          min-height: 100vh;
          background: radial-gradient(circle at 15% -10%, #ffe3c6 0%, #fff5ea 42%, #fff 100%);
          color: #1f1915;
          font-family: "Manrope", "Segoe UI", sans-serif;
          display: grid;
          grid-template-rows: auto 1fr auto;
        }

        .ls-header {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(12px);
          background: rgba(255, 250, 244, 0.9);
          border-bottom: 1px solid #efdcc8;
        }

        .ls-header-inner {
          max-width: 1180px;
          margin: 0 auto;
          height: 74px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .ls-logo {
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 21px;
          font-weight: 800;
          color: #17120e;
          cursor: pointer;
        }

        .ls-logo svg { color: #f47423; }

        .ls-nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .ls-nav a {
          text-decoration: none;
          color: #675547;
          font-size: 14px;
          font-weight: 700;
        }

        .ls-nav a.active {
          color: #dc5b21;
        }

        .ls-actions {
          display: flex;
          gap: 10px;
        }

        .ls-btn {
          border: 0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 16px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .ls-btn:hover { transform: translateY(-1px); }

        .ls-btn.solid {
          color: #fff;
          background: linear-gradient(135deg, #f67e24, #dc4e23);
          box-shadow: 0 10px 24px rgba(223, 94, 39, 0.28);
        }

        .ls-btn.ghost {
          color: #5a4d43;
          background: #fff;
          border: 1px solid #efdbc8;
        }

        .ls-mobile-toggle,
        .ls-mobile-menu {
          display: none;
        }

        .ls-mobile-toggle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid #efd7be;
          background: #fff;
          align-items: center;
          justify-content: center;
        }

        .ls-footer {
          margin-top: 72px;
          border-top: 1px solid #efdcca;
          background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(255, 246, 234, 0.92));
        }

        .ls-footer-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 30px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .ls-footer-brand h4 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .ls-footer-brand p {
          color: #6d5a4d;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ls-footer-brand small {
          color: #8a7462;
          font-size: 12px;
          font-weight: 700;
        }

        .ls-footer-columns {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }

        .ls-footer-col {
          min-width: 150px;
          display: grid;
          gap: 7px;
        }

        .ls-footer-col span {
          color: #b45f2f;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          font-weight: 800;
        }

        .ls-footer-col a,
        .ls-footer-col .legal {
          text-decoration: none;
          color: #6d5a4d;
          font-size: 14px;
          font-weight: 700;
        }

        .ls-footer-col .legal {
          font-size: 12px;
          color: #8a7462;
          margin-top: 4px;
        }

        @media (max-width: 860px) {
          .ls-nav,
          .ls-actions {
            display: none;
          }

          .ls-mobile-toggle,
          .ls-mobile-menu {
            display: flex;
          }

          .ls-mobile-menu {
            border-top: 1px solid #efdcc8;
            background: #fff8ef;
            padding: 10px 20px 14px;
            flex-direction: column;
            gap: 5px;
          }

          .ls-mobile-menu a {
            text-decoration: none;
            color: #5f4f42;
            font-weight: 700;
            padding: 6px 0;
          }

          .ls-footer-inner {
            flex-direction: column;
            align-items: flex-start;
          }

          .ls-footer-columns {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
