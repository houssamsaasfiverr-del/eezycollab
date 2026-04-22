import { BookOpen, FileText, Lightbulb, PlayCircle } from 'lucide-react';
import LandingShell from '../components/landing/LandingShell';

const resources = [
  {
    icon: BookOpen,
    title: 'Campaign Playbooks',
    text: 'Frameworks for creator selection, brief writing, and partnership structure.'
  },
  {
    icon: PlayCircle,
    title: 'Video Walkthroughs',
    text: 'Step-by-step onboarding and campaign flow walkthroughs for your team.'
  },
  {
    icon: FileText,
    title: 'Template Library',
    text: 'Outreach templates and collaboration briefs ready for adaptation.'
  },
  {
    icon: Lightbulb,
    title: 'Best Practices',
    text: 'Guides on improving response rates and reducing campaign friction.'
  }
];

const tracks = [
  {
    title: 'Beginner Track',
    text: 'Start with campaign setup fundamentals and creator selection frameworks.'
  },
  {
    title: 'Growth Track',
    text: 'Learn shortlist optimization, messaging quality, and response management at scale.'
  },
  {
    title: 'Ops Track',
    text: 'Build repeatable team playbooks, ownership rules, and reporting cadence.'
  }
];

export default function ResourcesPage() {
  return (
    <LandingShell activePath="/resources">
      <section className="rs-wrap">
        <div className="rs-head">
          <p>Resources</p>
          <h1>Knowledge center for better creator campaign execution.</h1>
        </div>

        <div className="rs-grid">
          {resources.map((item) => (
            <article key={item.title}>
              <item.icon size={18} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <section className="rs-tracks">
          <h2>Choose a learning track for your team maturity.</h2>
          <div className="rs-tracks-grid">
            {tracks.map((track) => (
              <article key={track.title}>
                <h3>{track.title}</h3>
                <p>{track.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rs-help">
          <h2>Need a tailored campaign playbook?</h2>
          <p>Reach out to our team for a guided rollout focused on your niche and outreach targets.</p>
          <a href="mailto:hello@collabfree.com">Talk to support</a>
        </section>
      </section>

      <style>{`
        .rs-wrap { max-width: 1100px; margin: 0 auto; padding: 62px 20px 20px; }
        .rs-head p { color: #d36022; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; margin-bottom: 10px; }
        .rs-head h1 { font-size: clamp(34px, 5vw, 58px); line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 20px; max-width: 900px; }
        .rs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rs-grid article { border: 1px solid #eedbc8; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 10px 22px rgba(210, 170, 128, .1); }
        .rs-grid article svg { color: #eb6d26; margin-bottom: 10px; }
        .rs-grid article h3 { font-size: 22px; margin-bottom: 8px; }
        .rs-grid article p { color: #6c584a; line-height: 1.66; }
        .rs-tracks { margin-top: 14px; border: 1px solid #eedbc8; border-radius: 16px; background: #fff; padding: 16px; }
        .rs-tracks h2 { font-size: clamp(24px, 4vw, 36px); letter-spacing: -0.02em; margin-bottom: 12px; }
        .rs-tracks-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .rs-tracks-grid article { border: 1px solid #f1decd; border-radius: 12px; background: #fffdf9; padding: 12px; }
        .rs-tracks-grid h3 { font-size: 18px; margin-bottom: 6px; }
        .rs-tracks-grid p { color: #6c584a; line-height: 1.6; }
        .rs-help { margin-top: 12px; border: 1px solid #eedbc8; border-radius: 16px; background: linear-gradient(145deg, #fff, #fff7ee); padding: 16px; }
        .rs-help h2 { font-size: clamp(24px, 4vw, 34px); letter-spacing: -0.02em; margin-bottom: 8px; }
        .rs-help p { color: #6c584a; line-height: 1.64; margin-bottom: 12px; }
        .rs-help a { display: inline-flex; text-decoration: none; border: 1px solid #efcba9; color: #cc5f24; border-radius: 999px; padding: 8px 12px; font-size: 13px; font-weight: 800; background: #fff4e8; }
        @media (max-width: 980px) { .rs-tracks-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 760px) { .rs-grid, .rs-tracks-grid { grid-template-columns: 1fr; } }
      `}</style>
    </LandingShell>
  );
}
