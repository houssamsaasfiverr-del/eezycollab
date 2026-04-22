import { Mail, MessageSquare, Phone } from 'lucide-react';
import LandingShell from '../components/landing/LandingShell';

const faqs = [
  {
    q: 'How fast can we onboard?',
    a: 'Most teams are live in under one week with clear campaign objectives and owner roles.'
  },
  {
    q: 'Do you support multi-brand teams?',
    a: 'Yes. We support structured workflows for agencies and in-house multi-brand operations.'
  },
  {
    q: 'Can we get setup support?',
    a: 'Absolutely. Share your use case and we will guide your rollout and template setup.'
  }
];

export default function ContactPage() {
  return (
    <LandingShell activePath="/contact">
      <section className="ct-wrap">
        <div className="ct-head">
          <p>Contact</p>
          <h1>Talk with our team about your creator campaign workflows.</h1>
        </div>

        <div className="ct-grid">
          <article className="ct-card">
            <h3>Send a message</h3>
            <label>
              Name
              <input placeholder="Your name" />
            </label>
            <label>
              Work email
              <input type="email" placeholder="you@company.com" />
            </label>
            <label>
              Message
              <textarea placeholder="Tell us what you want to build." />
            </label>
            <button type="button">Submit inquiry</button>
          </article>

          <article className="ct-info">
            <h3>Reach us directly</h3>
            <div><Mail size={16} /> hello@collabfree.com</div>
            <div><Phone size={16} /> +1 (000) 000-0000</div>
            <div><MessageSquare size={16} /> Average response under 24 hours</div>
          </article>
        </div>

        <section className="ct-hours">
          <h2>Office hours and support coverage</h2>
          <div className="ct-hours-grid">
            <article>
              <h3>Sales & onboarding</h3>
              <p>Mon-Fri, 9:00 AM - 6:00 PM (EST)</p>
            </article>
            <article>
              <h3>Technical support</h3>
              <p>Mon-Sat, response target under 24 hours.</p>
            </article>
            <article>
              <h3>Campaign advisory</h3>
              <p>Book guided sessions for workflow design and outreach tuning.</p>
            </article>
          </div>
        </section>

        <section className="ct-faq">
          <h2>Common questions</h2>
          <div className="ct-faq-grid">
            {faqs.map((item) => (
              <article key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <style>{`
        .ct-wrap { max-width: 1100px; margin: 0 auto; padding: 62px 20px 20px; }
        .ct-head p { color: #d15c22; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; margin-bottom: 10px; }
        .ct-head h1 { font-size: clamp(34px, 5vw, 58px); line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 20px; max-width: 920px; }
        .ct-grid { display: grid; grid-template-columns: 1.3fr .7fr; gap: 12px; }
        .ct-card, .ct-info { border: 1px solid #ecd9c7; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 10px 22px rgba(210, 168, 124, .11); }
        .ct-card h3, .ct-info h3 { font-size: 24px; margin-bottom: 12px; }
        .ct-card { display: grid; gap: 10px; }
        .ct-card label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; color: #564739; }
        .ct-card input, .ct-card textarea { width: 100%; border: 1px solid #e7d8c9; background: #fffefb; border-radius: 10px; padding: 10px; font-family: inherit; font-size: 14px; }
        .ct-card textarea { min-height: 120px; resize: vertical; }
        .ct-card button { border: 0; border-radius: 11px; padding: 11px; color: #fff; font-weight: 800; background: linear-gradient(135deg, #f67e24, #db4d23); cursor: pointer; }
        .ct-info { display: grid; align-content: start; gap: 10px; }
        .ct-info div { border: 1px solid #f0ddcc; border-radius: 10px; padding: 10px; color: #6b584a; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
        .ct-info svg { color: #e86b24; }
        .ct-hours, .ct-faq { margin-top: 12px; border: 1px solid #ecd9c7; border-radius: 16px; background: #fff; padding: 16px; box-shadow: 0 10px 22px rgba(210, 168, 124, .09); }
        .ct-hours h2, .ct-faq h2 { font-size: clamp(24px, 4vw, 34px); letter-spacing: -0.02em; margin-bottom: 12px; }
        .ct-hours-grid, .ct-faq-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .ct-hours-grid article, .ct-faq-grid article { border: 1px solid #f0decd; border-radius: 12px; background: #fffdf9; padding: 12px; }
        .ct-hours-grid h3, .ct-faq-grid h3 { font-size: 18px; margin-bottom: 6px; }
        .ct-hours-grid p, .ct-faq-grid p { color: #6a5749; line-height: 1.6; }
        @media (max-width: 980px) { .ct-hours-grid, .ct-faq-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 900px) { .ct-grid { grid-template-columns: 1fr; } }
        @media (max-width: 720px) { .ct-hours-grid, .ct-faq-grid { grid-template-columns: 1fr; } }
      `}</style>
    </LandingShell>
  );
}
