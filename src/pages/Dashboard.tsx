import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Calendar,
  Crown,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Users,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProjectHistory from '../components/ProjectHistory';
import { CampaignEmailLog, fetchCampaignInbox } from '../services/brevoEmail';

interface UserData {
  email?: string;
  displayName?: string;
  plan: 'free' | 'pro';
  credits: number;
  maxCredits: number;
  dailyCreditsUsed?: number;
  dailyLimit?: number;
  createdAt?: string;
}

interface ProjectItem {
  id: string;
  name: string;
  firstPrompt?: string;
  files: Array<{ name: string; content?: string }>;
  createdAt: string;
  lastModified: string;
}

type DashboardSection = 'campaigns' | 'lists' | 'inbox' | 'analytics';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>('campaigns');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [inboxRows, setInboxRows] = useState<CampaignEmailLog[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section');
    if (sectionFromQuery === 'campaigns' || sectionFromQuery === 'lists' || sectionFromQuery === 'inbox' || sectionFromQuery === 'analytics') {
      setActiveSection(sectionFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('section') === activeSection) return;
    setSearchParams({ section: activeSection });
  }, [activeSection, searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const hydrate = async () => {
      const { data } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.uid)
        .order('last_modified', { ascending: false });

      if (data) {
        setUserData({
          email: data.email || user.email || '',
          displayName: data.display_name || user.displayName || 'Creator team',
          plan: data.plan || 'free',
          credits: data.credits_remaining || data.credits || 0,
          maxCredits: data.max_credits || data.total_credits || 0,
          dailyCreditsUsed: data.daily_credits_used || 0,
          dailyLimit: data.daily_limit || 5,
          createdAt: data.created_at
        });
      }

      const parsedProjects: ProjectItem[] = (projectsData || []).map((row) => ({
        id: row.id,
        name: row.name || 'Untitled Project',
        firstPrompt: row.first_prompt || '',
        files: Array.isArray(row.files) ? row.files : [],
        createdAt: row.created_at || new Date().toISOString(),
        lastModified: row.last_modified || row.created_at || new Date().toISOString()
      }));

      setProjects(parsedProjects);
      setLoading(false);
    };

    void hydrate();

    const channel = supabase
      .channel(`dashboard-user-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.uid}`
        },
        () => {
          void hydrate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.uid}`
        },
        () => {
          void hydrate();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [navigate, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const refreshInbox = async () => {
    if (!user) return;

    setInboxLoading(true);
    setInboxError('');
    try {
      const rows = await fetchCampaignInbox(user.uid);
      setInboxRows(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load inbox';
      setInboxError(message);
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    if (!user || activeSection !== 'inbox') return;
    void refreshInbox();
  }, [activeSection, user]);

  const joinedDate = useMemo(() => {
    if (!userData?.createdAt) return 'Unknown';
    return new Date(userData.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [userData?.createdAt]);

  const resolvedUserData: UserData = userData ?? {
    email: user?.email || '',
    displayName: user?.displayName || 'Creator team',
    plan: 'free',
    credits: 0,
    maxCredits: 0,
    dailyCreditsUsed: 0,
    dailyLimit: 5,
    createdAt: undefined
  };

  const isPro = resolvedUserData.plan === 'pro';
  const dailyRemaining = Math.max(0, (resolvedUserData.dailyLimit || 5) - (resolvedUserData.dailyCreditsUsed || 0));
  const creditsPercent = resolvedUserData.maxCredits > 0 ? Math.min(100, (resolvedUserData.credits / resolvedUserData.maxCredits) * 100) : 0;

  const metricCards = [
    {
      title: 'Available Credits',
      value: String(resolvedUserData.credits),
      note: 'Live from billing data',
      icon: Wallet
    },
    {
      title: 'Monthly Capacity',
      value: String(resolvedUserData.maxCredits),
      note: 'Configured in your active plan',
      icon: BarChart3
    },
    {
      title: 'Daily Prompts Left',
      value: isPro ? 'Unlimited' : String(dailyRemaining),
      note: isPro ? 'No daily cap on Pro' : `${resolvedUserData.dailyCreditsUsed || 0}/${resolvedUserData.dailyLimit || 5} used`,
      icon: MessageSquare
    },
    {
      title: 'Current Plan',
      value: isPro ? 'Pro' : 'Free',
      note: isPro ? 'Priority features enabled' : 'Free access enabled',
      icon: Crown
    }
  ];

  const recentProjects = useMemo(() => projects.slice(0, 5), [projects]);

  const savedHandles = useMemo(() => {
    const handles = new Set<string>();

    for (const project of projects) {
      const draftFile = project.files.find((file) => file.name === 'campaign-draft.json');
      if (!draftFile?.content) continue;

      try {
        const parsed = JSON.parse(String(draftFile.content)) as { influencerInput?: string };
        const raw = parsed.influencerInput || '';
        raw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((handle) => handles.add(handle));
      } catch {
        // Skip malformed draft content and continue collecting usable handles.
      }
    }

    return Array.from(handles);
  }, [projects]);

  const projectsThisMonth = useMemo(() => {
    const now = new Date();
    return projects.filter((project) => {
      const created = new Date(project.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length;
  }, [projects]);

  const avgFilesPerProject = useMemo(() => {
    if (projects.length === 0) return 0;
    const total = projects.reduce((sum, project) => sum + project.files.length, 0);
    return Number((total / projects.length).toFixed(1));
  }, [projects]);

  const navItems: Array<{ id: DashboardSection; label: string; icon: ComponentType<{ size?: string | number }> }> = [
    { id: 'campaigns', label: 'Campaigns', icon: Target },
    { id: 'lists', label: 'Saved Lists', icon: Users },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const sectionMeta: Record<DashboardSection, { title: string; subtitle: string }> = {
    campaigns: {
      title: 'Campaign Dashboard',
      subtitle: `Welcome back, ${resolvedUserData.displayName}.`
    },
    lists: {
      title: 'Saved Influencer Lists',
      subtitle: 'Collected from all your campaign drafts.'
    },
    inbox: {
      title: 'Inbox',
      subtitle: 'Track campaign outreach and reply progress.'
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Live campaign insights from your project history.'
    }
  };

  if (loading || !userData) {
    return (
      <div className="ec-dash-loading">
        <Sparkles className="spin" size={22} />
        <span>Loading workspace...</span>
        <style>{`
          .ec-dash-loading {
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

  const renderSection = () => {
    if (activeSection === 'campaigns') {
      return (
        <>
          <section className="ec-metrics-grid">
            {metricCards.map((card) => (
              <article key={card.title} className="ec-metric-card">
                <div>
                  <p>{card.title}</p>
                  <strong>{card.value}</strong>
                  <small>{card.note}</small>
                </div>
                <card.icon size={17} />
              </article>
            ))}
          </section>

          <section className="ec-layout-grid">
            <article className="ec-panel ec-projects-panel">
              <div className="ec-panel-head">
                <h2>Recent Projects</h2>
                <button onClick={() => navigate('/builder')}>New project</button>
              </div>
              <ProjectHistory maxItems={5} showTitle={false} />
            </article>

            <article className="ec-panel ec-account-panel">
              <h2>Account</h2>
              <div className="ec-account-row">
                <span>Plan</span>
                <strong>{isPro ? 'Pro' : 'Free'}</strong>
              </div>
              <div className="ec-account-row">
                <span>Email</span>
                <strong>{userData.email || user?.email}</strong>
              </div>
              <div className="ec-account-row">
                <span>Joined</span>
                <strong>{joinedDate}</strong>
              </div>
              <div className="ec-account-row">
                <span>Billing Window</span>
                <strong><Calendar size={14} /> Monthly</strong>
              </div>
            </article>
          </section>
        </>
      );
    }

    if (activeSection === 'lists') {
      return (
        <section className="ec-panel ec-list-panel">
          <div className="ec-panel-head">
            <h2>Saved Handles</h2>
            <button onClick={() => navigate('/builder')}>Add from campaign</button>
          </div>

          {savedHandles.length === 0 ? (
            <div className="ec-empty-state">
              <Users size={26} />
              <h3>No saved lists yet</h3>
              <p>Create a shortlist in Builder to populate this section automatically.</p>
            </div>
          ) : (
            <div className="ec-handle-grid">
              {savedHandles.map((handle) => (
                <div key={handle} className="ec-handle-chip">{handle}</div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (activeSection === 'inbox') {
      return (
        <section className="ec-panel ec-inbox-panel">
          <div className="ec-panel-head">
            <h2>Campaign Inbox</h2>
            <div className="ec-panel-actions">
              <button onClick={() => void refreshInbox()}>{inboxLoading ? 'Refreshing...' : 'Refresh'}</button>
              <button onClick={() => navigate('/builder')}>Open outreach setup</button>
            </div>
          </div>

          {inboxError && <div className="ec-inline-error">{inboxError}</div>}

          {inboxLoading && (
            <div className="ec-empty-state">
              <Loader2 size={24} className="spin" />
              <h3>Syncing inbox events</h3>
              <p>Checking Brevo delivery and reply activity...</p>
            </div>
          )}

          {!inboxLoading && inboxRows.length === 0 && (
            <div className="ec-empty-state">
              <MessageSquare size={26} />
              <h3>No email activity yet</h3>
              <p>Send bulk emails from Builder and your inbox timeline appears here.</p>
            </div>
          )}

          {!inboxLoading && inboxRows.length > 0 && (
            <div className="ec-inbox-list">
              {inboxRows.slice(0, 40).map((row) => (
                <article key={row.id} className="ec-inbox-row">
                  <div>
                    <strong>{row.recipient_name || row.recipient_email}</strong>
                    <p>{row.subject || 'No subject'}</p>
                    <small>{new Date(row.created_at).toLocaleString('en-US')}</small>
                  </div>
                  <span className={`ec-status-chip ${row.status}`}>{row.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <section className="ec-layout-grid ec-layout-grid-analytics">
        <article className="ec-panel">
          <div className="ec-panel-head">
            <h2>Campaign Health</h2>
          </div>
          <div className="ec-kpi-grid">
            <div>
              <span>Total Projects</span>
              <strong>{projects.length}</strong>
            </div>
            <div>
              <span>Created This Month</span>
              <strong>{projectsThisMonth}</strong>
            </div>
            <div>
              <span>Avg Files/Project</span>
              <strong>{avgFilesPerProject}</strong>
            </div>
          </div>
        </article>
        <article className="ec-panel">
          <div className="ec-panel-head">
            <h2>Latest Projects</h2>
          </div>
          {recentProjects.length === 0 ? (
            <div className="ec-empty-state">
              <BarChart3 size={26} />
              <h3>No analytics yet</h3>
              <p>Create your first campaign to start seeing usage trends.</p>
            </div>
          ) : (
            <div className="ec-list-rows">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  className="ec-list-row"
                  onClick={() => navigate(`/builder?project=${project.id}`)}
                >
                  <span>{project.name}</span>
                  <small>{new Date(project.lastModified).toLocaleDateString('en-US')}</small>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>
    );
  };

  return (
    <div className="ec-dash">
      <aside className="ec-sidebar">
        <button className="ec-brand" onClick={() => navigate('/dashboard')}>
          <Sparkles size={18} />
          <span>CollabFree</span>
        </button>

        <nav className="ec-navlist">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="ec-usage">
          <p>Subscription Usage</p>
          <strong>{userData.credits} / {userData.maxCredits} credits</strong>
          <div className="bar">
            <span style={{ width: `${creditsPercent}%` }} />
          </div>
          {!isPro && <small>{dailyRemaining} prompts remaining today</small>}
        </div>

        <button className="ec-logout" onClick={handleLogout}>
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      <div className="ec-main">
        <header className="ec-topbar">
          <div>
            <h1>{sectionMeta[activeSection].title}</h1>
            <p>{sectionMeta[activeSection].subtitle}</p>
          </div>
          <div className="ec-topbar-actions">
            <button className="ec-icon-btn" onClick={() => setNotificationOpen((prev) => !prev)}><Bell size={16} /></button>
            <button className="ec-primary" onClick={() => navigate('/builder')}>
              <Plus size={15} /> New Campaign
            </button>
          </div>
          {notificationOpen && (
            <div className="ec-notice-popover">
              <strong>Notifications</strong>
              <p>Your workspace is synced. New campaign updates will appear here.</p>
            </div>
          )}
        </header>

        {renderSection()}
      </div>

      <style>{`
        .ec-dash {
          min-height: 100vh;
          background: linear-gradient(140deg, #fffaf4, #fff5eb 40%, #fff);
          color: #211a15;
          display: grid;
          grid-template-columns: 280px 1fr;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .ec-sidebar {
          border-right: 1px solid #f0ddca;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(255, 252, 248, 0.88);
          backdrop-filter: blur(8px);
        }

        .ec-brand {
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 19px;
          color: #19130f;
          cursor: pointer;
          width: fit-content;
        }

        .ec-brand svg { color: #ef6d25; }

        .ec-navlist {
          display: grid;
          gap: 8px;
        }

        .ec-navlist button {
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          color: #655343;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }

        .ec-navlist button.active,
        .ec-navlist button:hover {
          border-color: #f2d9c0;
          background: #fff;
          color: #2b221c;
        }

        .ec-usage {
          margin-top: auto;
          background: #fff;
          border: 1px solid #f2ddc8;
          border-radius: 14px;
          padding: 14px;
          display: grid;
          gap: 8px;
        }

        .ec-usage p {
          font-size: 12px;
          color: #786353;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ec-usage strong { font-size: 17px; }

        .ec-usage .bar {
          width: 100%;
          height: 7px;
          background: #f7eade;
          border-radius: 999px;
          overflow: hidden;
        }

        .ec-usage .bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #f68a2d, #df5026);
        }

        .ec-usage small {
          color: #836d5f;
          font-size: 12px;
          font-weight: 700;
        }

        .ec-upgrade {
          border: 0;
          border-radius: 10px;
          padding: 10px;
          background: #f57a23;
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-logout {
          border: 1px solid #f2daca;
          border-radius: 11px;
          background: #fff;
          color: #6d584b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-main {
          padding: 28px;
          display: grid;
          gap: 18px;
        }

        .ec-topbar {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #f2dfce;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 22px rgba(197, 149, 106, 0.12);
        }

        .ec-topbar h1 {
          font-size: clamp(24px, 3vw, 34px);
          margin-bottom: 3px;
          letter-spacing: -0.02em;
        }

        .ec-topbar p { color: #7b6556; }

        .ec-topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ec-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid #f2deca;
          background: #fff;
          color: #715a4b;
          cursor: pointer;
        }

        .ec-primary {
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #f47d20, #df4f24);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .ec-notice-popover {
          position: absolute;
          right: 18px;
          top: calc(100% + 8px);
          border: 1px solid #f0dcc8;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
          width: 280px;
          box-shadow: 0 16px 24px rgba(173, 128, 90, 0.18);
          z-index: 20;
        }

        .ec-notice-popover strong {
          display: block;
          color: #2f241c;
          margin-bottom: 4px;
        }

        .ec-notice-popover p {
          color: #7a6555;
          font-size: 13px;
          line-height: 1.4;
        }

        .ec-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .ec-metric-card {
          background: #fff;
          border: 1px solid #f2ddca;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          color: #e86c24;
        }

        .ec-metric-card p {
          color: #816a59;
          font-size: 13px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ec-metric-card strong {
          color: #2f241c;
          font-size: 28px;
          letter-spacing: -0.02em;
          display: block;
        }

        .ec-metric-card small {
          color: #846f60;
          font-size: 12px;
          font-weight: 700;
        }

        .ec-layout-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
        }

        .ec-layout-grid-analytics {
          grid-template-columns: 1fr 1fr;
        }

        .ec-panel {
          background: #fff;
          border: 1px solid #f2dec9;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 22px rgba(204, 162, 124, 0.12);
        }

        .ec-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .ec-panel-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .ec-panel-head h2,
        .ec-account-panel h2 {
          font-size: 20px;
        }

        .ec-panel-head button {
          border: 1px solid #f2dbc1;
          border-radius: 10px;
          background: #fff7ef;
          color: #cf6022;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-inline-error {
          margin-bottom: 10px;
          border: 1px solid #efc9c9;
          background: #fff3f3;
          color: #a54343;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .ec-account-panel {
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .ec-account-row {
          border: 1px solid #f2e0d0;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #6f5b4d;
          font-size: 14px;
        }

        .ec-account-row strong {
          color: #2b221d;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .ec-empty-state {
          min-height: 220px;
          border: 1px dashed #eed9c4;
          border-radius: 12px;
          display: grid;
          place-content: center;
          text-align: center;
          gap: 8px;
          color: #7e6959;
          padding: 16px;
        }

        .ec-empty-state h3 {
          color: #32271f;
          font-size: 20px;
        }

        .ec-handle-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ec-handle-chip {
          border: 1px solid #efddca;
          background: #fff8ef;
          color: #6f594a;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 999px;
        }

        .ec-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .ec-kpi-grid div {
          border: 1px solid #efdbc7;
          border-radius: 12px;
          padding: 12px;
          background: #fffdf9;
        }

        .ec-kpi-grid span {
          font-size: 12px;
          color: #816c5c;
          display: block;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ec-kpi-grid strong {
          font-size: 28px;
          color: #2b2119;
          letter-spacing: -0.02em;
        }

        .ec-list-rows {
          display: grid;
          gap: 8px;
        }

        .ec-inbox-list {
          display: grid;
          gap: 8px;
        }

        .ec-inbox-row {
          border: 1px solid #efddca;
          border-radius: 12px;
          background: #fff;
          padding: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ec-inbox-row strong {
          font-size: 14px;
          color: #32271f;
        }

        .ec-inbox-row p {
          color: #735f51;
          font-size: 13px;
          margin: 2px 0;
        }

        .ec-inbox-row small {
          color: #8a7464;
          font-size: 11px;
          font-weight: 600;
        }

        .ec-status-chip {
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid #ead8c6;
          color: #715d4f;
          background: #fff;
          white-space: nowrap;
        }

        .ec-status-chip.sent,
        .ec-status-chip.delivered,
        .ec-status-chip.opened,
        .ec-status-chip.clicked {
          border-color: #bfe7ce;
          color: #1f7a40;
          background: #ecfaf1;
        }

        .ec-status-chip.replied {
          border-color: #bcd9ff;
          color: #1f5fa8;
          background: #edf4ff;
        }

        .ec-status-chip.failed,
        .ec-status-chip.bounced,
        .ec-status-chip.deferred {
          border-color: #f2c7c7;
          color: #a53e3e;
          background: #fff3f3;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ec-list-row {
          border: 1px solid #efddca;
          background: #fff;
          border-radius: 12px;
          padding: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 700;
          color: #3b2d24;
        }

        .ec-list-row small {
          color: #897263;
          font-weight: 600;
        }

        @media (max-width: 1120px) {
          .ec-dash {
            grid-template-columns: 1fr;
          }

          .ec-sidebar {
            border-right: 0;
            border-bottom: 1px solid #f0ddca;
          }

          .ec-navlist {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ec-metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ec-layout-grid {
            grid-template-columns: 1fr;
          }

          .ec-kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .ec-main {
            padding: 14px;
          }

          .ec-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .ec-metrics-grid,
          .ec-navlist {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}