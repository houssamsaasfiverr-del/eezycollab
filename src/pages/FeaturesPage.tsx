import { BarChart3, Mail, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandingShell from '../components/landing/LandingShell';

const features = [
  {
    icon: Search,
    title: 'Discovery Filters',
    desc: 'Search creators by niche, audience size, location, and language with campaign-first filtering.'
  },
  {
    icon: Users,
    title: 'Smart Shortlists',
    desc: 'Organize selected influencers into lists by campaign goal, platform, and budget priority.'
  },
  {
    icon: Mail,
    title: 'Outreach Templates',
    desc: 'Create reusable outreach templates with placeholders and quality checks before sending.'
  },
  {
    icon: BarChart3,
    title: 'Reply Visibility',
    desc: 'Track outreach status and response progress in one dashboard without manual spreadsheets.'
  },
  {
    icon: ShieldCheck,
    title: 'Team Workflow',
    desc: 'Collaborate with teammates and keep campaign stages clearly structured across projects.'
  },
  {
    icon: Sparkles,
    title: 'AI Assistance',
    desc: 'Use AI-powered prompts for faster targeting and campaign setup decisions.'
  }
];

const pillars = [
  {
    title: 'Faster Discovery',
    value: '3x',
    text: 'Reduce creator research time with structured filters and repeatable search inputs.'
  },
  {
    title: 'Higher Reply Rate',
    value: '42%',
    text: 'Template quality checks help teams send cleaner and more personalized outreach.'
  },
  {
    title: 'Less Tool Switching',
    value: '1 hub',
    text: 'Search, shortlist, outreach, and reply tracking stay in one coordinated workspace.'
  }
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <LandingShell activePath="/features">
      <section className="lp-wrap">
        <div className="lp-head">
          <p>Platform Capabilities</p>
          <h1>Everything needed to run high-quality influencer campaigns.</h1>
        </div>

        <div className="lp-grid">
          {features.map((item) => (
            <article key={item.title}>
              <item.icon size={18} />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>

        <section className="lp-proof">
          {pillars.map((item) => (
            <article key={item.title}>
              <strong>{item.value}</strong>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="lp-compare">
          <h2>Built for campaign teams, not generic CRM workflows.</h2>
          <div className="lp-compare-grid">
            <article>
              <h3>With CollabFree</h3>
              <ul>
                <li>Campaign-first creator discovery</li>
                <li>Structured outreach templates</li>
                <li>Reply visibility by campaign stage</li>
              </ul>
            </article>
            <article>
              <h3>Without CollabFree</h3>
              <ul>
                <li>Manual spreadsheets and fragmented notes</li>
                <li>Inconsistent outreach quality</li>
                <li>Unclear ownership across teammates</li>
              </ul>
            </article>
          </div>
        </section>

        <div className="lp-cta">
          <h2>Start building your first campaign workflow</h2>
          <button onClick={() => navigate('/builder')}>Open Campaign Builder</button>
        </div>
      </section>

      <style>{`
        .lp-wrap { max-width: 1180px; margin: 0 auto; padding: 62px 20px 10px; }
        .lp-head p { color: #d45e22; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: .08em; margin-bottom: 10px; }
        .lp-head h1 { font-size: clamp(34px, 5.2vw, 60px); line-height: 1.06; letter-spacing: -0.03em; max-width: 900px; margin-bottom: 24px; }
        .lp-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .lp-grid article { background: #fff; border: 1px solid #efdcc8; border-radius: 16px; padding: 16px; box-shadow: 0 10px 22px rgba(212, 167, 124, .11); }
        .lp-grid article svg { color: #eb6d26; margin-bottom: 10px; }
        .lp-grid article h3 { font-size: 20px; margin-bottom: 8px; }
        .lp-grid article p { color: #665447; line-height: 1.65; }
        .lp-proof { margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .lp-proof article { border: 1px solid #efdcc8; background: #fffaf4; border-radius: 16px; padding: 16px; }
        .lp-proof strong { font-size: 28px; letter-spacing: -0.03em; color: #d95a22; display: block; margin-bottom: 6px; }
        .lp-proof h3 { font-size: 18px; margin-bottom: 6px; }
        .lp-proof p { color: #695648; line-height: 1.62; }
        .lp-compare { margin-top: 16px; border: 1px solid #efdac7; border-radius: 18px; background: #fff; padding: 18px; }
        .lp-compare h2 { font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.02em; margin-bottom: 12px; }
        .lp-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .lp-compare-grid article { border: 1px solid #f1decc; border-radius: 14px; padding: 14px; background: #fffdf9; }
        .lp-compare-grid h3 { font-size: 18px; margin-bottom: 8px; }
        .lp-compare-grid ul { display: grid; gap: 7px; color: #665447; line-height: 1.55; padding-left: 18px; }
        .lp-cta { margin-top: 18px; border: 1px solid #efdac7; border-radius: 18px; padding: 20px; background: linear-gradient(135deg, #fff, #fff6eb); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .lp-cta h2 { font-size: clamp(24px, 3.6vw, 34px); letter-spacing: -0.02em; }
        .lp-cta button { border: 0; border-radius: 12px; padding: 11px 16px; color: #fff; font-weight: 800; background: linear-gradient(135deg, #f67d24, #db4e23); cursor: pointer; }
        @media (max-width: 980px) { .lp-grid, .lp-proof { grid-template-columns: 1fr 1fr; } .lp-compare-grid { grid-template-columns: 1fr; } .lp-cta { flex-direction: column; align-items: flex-start; } }
        @media (max-width: 720px) { .lp-grid, .lp-proof { grid-template-columns: 1fr; } }
      `}</style>
    </LandingShell>
  );
}
