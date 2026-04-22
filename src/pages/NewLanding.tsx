import { ArrowRight, BarChart3, CheckCircle2, Compass, Layers, MailCheck, MessageSquare, Rocket, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandingShell from '../components/landing/LandingShell';
import { CREDIT_PACKAGES, CREDITS_PER_PROMPT, FREE_PLAN, PRO_PLAN } from '../types/plans';

const pageBlocks = [
  {
    icon: Compass,
    title: 'Features Page',
    text: 'Deep overview of discovery, shortlist, and outreach capabilities.',
    path: '/features'
  },
  {
    icon: Layers,
    title: 'Workflow Page',
    text: 'Structured five-step campaign flow from setup to reply monitoring.',
    path: '/workflow'
  },
  {
    icon: MessageSquare,
    title: 'Resources and Contact',
    text: 'Knowledge center, templates, and direct support contact channel.',
    path: '/resources'
  }
];

const spotlightStats = [
  { label: 'Campaign steps mapped', value: '5' },
  { label: 'Dedicated landing pages', value: '6+' },
  { label: 'Inbox and send sync', value: 'Live' }
];

const workflowHighlights = [
  {
    icon: Rocket,
    title: 'Campaign setup that stays structured',
    text: 'Capture goals, regions, and targeting criteria in one project draft that stays editable.'
  },
  {
    icon: Users,
    title: 'Shortlist and manage creators faster',
    text: 'Bring creator results into shortlist mode and keep your campaign list centralized.'
  },
  {
    icon: MailCheck,
    title: 'Bulk email engine with inbox tracking',
    text: 'Send to many recipients using reusable templates and monitor status from sent to replied.'
  }
];

const proofCards = [
  {
    icon: BarChart3,
    title: 'Built for operations clarity',
    text: 'Every project can persist draft data, list selections, and outreach setup for repeat execution.'
  },
  {
    icon: MessageSquare,
    title: 'Inbox-style campaign feedback',
    text: 'Email event statuses are synced into your dashboard so teams can follow up with confidence.'
  }
];

export function NewLanding() {
  const navigate = useNavigate();

  return (
    <LandingShell activePath="/">
      <section className="home-hero">
        <div className="hero-bg hero-left" />
        <div className="hero-bg hero-right" />

        <div className="hero-main">
          <p className="hero-kicker">Influencer Campaign Infrastructure</p>
          <h1>A richer campaign workspace built for speed, clarity, and scale.</h1>
          <p className="hero-sub">
            CollabFree gives teams a complete operating layer for creator campaigns. Discover better,
            shortlist faster, and execute outreach with less friction.
          </p>

          <div className="hero-buttons">
            <button className="solid" onClick={() => navigate('/builder')}>
              Build Campaign
              <ArrowRight size={16} />
            </button>
            <button className="ghost" onClick={() => navigate('/features')}>
              Explore Features
            </button>
          </div>

          <div className="hero-notes">
            <div><CheckCircle2 size={15} /> Complete landing pages ready</div>
            <div><CheckCircle2 size={15} /> Responsive desktop and mobile layout</div>
            <div><CheckCircle2 size={15} /> Data-aware plan summary</div>
          </div>
        </div>

        <aside className="hero-side">
          <div className="hero-side-head">
            <span>Live plan snapshot</span>
            <span className="chip">Config-backed</span>
          </div>
          <div className="hero-side-grid">
            <article>
              <h4>Free prompts</h4>
              <strong>{FREE_PLAN.prompts}</strong>
            </article>
            <article>
              <h4>Pro prompts</h4>
              <strong>{PRO_PLAN.prompts}</strong>
            </article>
            <article>
              <h4>Credits / prompt</h4>
              <strong>{CREDITS_PER_PROMPT}</strong>
            </article>
            <article>
              <h4>Packages</h4>
              <strong>{CREDIT_PACKAGES.length}</strong>
            </article>
          </div>
        </aside>
      </section>

      <section className="home-pages">
        <div className="home-pages-head">
          <p>Complete Marketing Website</p>
          <h2>Every landing page section is now mapped into dedicated pages.</h2>
        </div>

        <div className="home-pages-grid">
          {pageBlocks.map((block) => (
            <article key={block.title}>
              <block.icon size={18} />
              <h3>{block.title}</h3>
              <p>{block.text}</p>
              <button onClick={() => navigate(block.path)}>
                Open page
                <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="home-spotlight">
        <div className="home-spotlight-head">
          <p>Why teams switch</p>
          <h2>Everything from discovery to outbound and inbox tracking in one campaign workspace.</h2>
        </div>

        <div className="home-spotlight-stats">
          {spotlightStats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>

        <div className="home-highlight-grid">
          {workflowHighlights.map((item) => (
            <article key={item.title}>
              <item.icon size={18} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-proof">
        <div className="home-proof-grid">
          {proofCards.map((item) => (
            <article key={item.title}>
              <item.icon size={18} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <aside className="home-proof-cta">
          <p>Ready to start?</p>
          <h3>Launch your first outreach campaign with built-in bulk send and inbox visibility.</h3>
          <button onClick={() => navigate('/builder')}>
            Open Campaign Builder
            <ArrowRight size={14} />
          </button>
        </aside>
      </section>

      <style>{`
        .home-hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 68px 20px 42px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 22px;
          position: relative;
        }

        .hero-bg {
          position: absolute;
          border-radius: 999px;
          filter: blur(24px);
          opacity: 0.56;
          pointer-events: none;
          animation: drift 8s ease-in-out infinite;
        }

        .hero-left {
          width: 300px;
          height: 300px;
          background: #ffd8b2;
          left: -90px;
          top: -10px;
        }

        .hero-right {
          width: 260px;
          height: 260px;
          background: #fddfca;
          right: 80px;
          bottom: 18px;
          animation-delay: 1.2s;
        }

        .hero-main {
          position: relative;
          z-index: 2;
          animation: rise .6s ease;
        }

        .hero-kicker {
          color: #d35e22;
          font-size: 13px;
          letter-spacing: .08em;
          text-transform: uppercase;
          font-weight: 800;
          margin-bottom: 13px;
        }

        .hero-main h1 {
          font-size: clamp(36px, 5.6vw, 66px);
          letter-spacing: -0.035em;
          line-height: 1.02;
          margin-bottom: 14px;
          max-width: 700px;
          font-family: "Sora", "Manrope", "Segoe UI", sans-serif;
        }

        .hero-sub {
          max-width: 620px;
          color: #655345;
          line-height: 1.7;
          font-size: 18px;
        }

        .hero-buttons {
          margin-top: 26px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hero-buttons button {
          border: 0;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .hero-buttons .solid {
          color: #fff;
          background: linear-gradient(135deg, #f57d24, #dd4f23);
          box-shadow: 0 14px 28px rgba(222, 92, 37, .3);
        }

        .hero-buttons .ghost {
          color: #5d4e43;
          background: #fff;
          border: 1px solid #efdcc9;
        }

        .hero-notes {
          margin-top: 22px;
          display: grid;
          gap: 8px;
        }

        .hero-notes div {
          border: 1px solid #efdcc8;
          background: rgba(255, 255, 255, .85);
          border-radius: 999px;
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 7px;
          color: #5f4f42;
          font-size: 13px;
          font-weight: 700;
          padding: 7px 11px;
        }

        .hero-notes svg { color: #eb6a25; }

        .hero-side {
          position: relative;
          z-index: 2;
          align-self: center;
          border: 1px solid #edd9c5;
          border-radius: 24px;
          background: rgba(255,255,255,.86);
          backdrop-filter: blur(8px);
          box-shadow: 0 20px 42px rgba(183, 130, 82, .21);
          padding: 20px;
          animation: rise .8s ease;
        }

        .hero-side-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          color: #4c4037;
          font-size: 14px;
          font-weight: 800;
        }

        .chip {
          border: 1px solid #f4c89f;
          background: #fff0df;
          color: #d16022;
          border-radius: 999px;
          padding: 3px 9px;
          font-size: 11px;
        }

        .hero-side-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .hero-side-grid article {
          border: 1px solid #efddd0;
          border-radius: 12px;
          background: #fff;
          padding: 10px;
        }

        .hero-side-grid h4 {
          font-size: 12px;
          color: #806a5b;
          margin-bottom: 6px;
        }

        .hero-side-grid strong {
          font-size: 31px;
          letter-spacing: -0.03em;
        }

        .home-pages {
          max-width: 1180px;
          margin: 0 auto;
          padding: 10px 20px 20px;
        }

        .home-spotlight,
        .home-proof {
          max-width: 1180px;
          margin: 0 auto;
          padding: 8px 20px 10px;
        }

        .home-pages-head p {
          color: #d35d22;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .home-pages-head h2 {
          font-size: clamp(28px, 4.6vw, 46px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
          max-width: 900px;
        }

        .home-pages-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .home-pages-grid article {
          border: 1px solid #edd9c5;
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 22px rgba(205, 160, 119, .12);
          display: grid;
          gap: 8px;
        }

        .home-pages-grid article svg { color: #ea6a24; }
        .home-pages-grid article h3 { font-size: 21px; }
        .home-pages-grid article p { color: #675447; line-height: 1.65; }

        .home-pages-grid article button {
          margin-top: 6px;
          border: 1px solid #efdbc8;
          border-radius: 10px;
          background: #fff7ef;
          color: #cd5c21;
          font-size: 13px;
          font-weight: 800;
          width: fit-content;
          padding: 8px 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .home-spotlight-head p {
          color: #d35d22;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .home-spotlight-head h2 {
          font-size: clamp(26px, 4.4vw, 40px);
          line-height: 1.13;
          letter-spacing: -0.03em;
          max-width: 920px;
        }

        .home-spotlight-stats {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .home-spotlight-stats article {
          border: 1px solid #ebd9c7;
          border-radius: 14px;
          background: linear-gradient(145deg, #fff, #fff8ee);
          padding: 13px;
          display: grid;
          gap: 4px;
        }

        .home-spotlight-stats strong {
          font-size: 31px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .home-spotlight-stats span {
          color: #705d4f;
          font-size: 13px;
          font-weight: 700;
        }

        .home-highlight-grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .home-highlight-grid article {
          border: 1px solid #ebd8c6;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          box-shadow: 0 10px 22px rgba(205, 160, 119, .12);
          display: grid;
          gap: 8px;
        }

        .home-highlight-grid article svg {
          color: #e56b26;
        }

        .home-highlight-grid article h3 {
          font-size: 20px;
          line-height: 1.2;
        }

        .home-highlight-grid article p {
          color: #6f5c4e;
          line-height: 1.62;
        }

        .home-proof {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 10px;
          padding-bottom: 20px;
        }

        .home-proof-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .home-proof-grid article {
          border: 1px solid #ebd8c6;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 8px;
        }

        .home-proof-grid article svg {
          color: #e36b27;
        }

        .home-proof-grid article h3 {
          font-size: 20px;
        }

        .home-proof-grid article p {
          color: #6f5b4e;
          line-height: 1.6;
        }

        .home-proof-cta {
          border: 1px solid #e8d4c0;
          border-radius: 14px;
          background: linear-gradient(150deg, #fff6ec, #fff);
          padding: 16px;
          display: grid;
          gap: 10px;
          align-content: start;
        }

        .home-proof-cta p {
          color: #cf5f24;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 11px;
          font-weight: 800;
        }

        .home-proof-cta h3 {
          font-size: 26px;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .home-proof-cta button {
          border: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, #f57d24, #dc4f23);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          width: fit-content;
          padding: 10px 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        @keyframes drift {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(9px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1040px) {
          .home-hero { grid-template-columns: 1fr; }
          .home-pages-grid,
          .home-spotlight-stats,
          .home-highlight-grid,
          .home-proof-grid { grid-template-columns: 1fr 1fr; }
          .home-proof { grid-template-columns: 1fr; }
        }

        @media (max-width: 740px) {
          .hero-side-grid,
          .home-pages-grid,
          .home-spotlight-stats,
          .home-highlight-grid,
          .home-proof-grid { grid-template-columns: 1fr; }
          .hero-sub { font-size: 16px; }
        }
      `}</style>
    </LandingShell>
  );
}

export default NewLanding;
