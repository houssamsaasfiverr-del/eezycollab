import { useNavigate } from 'react-router-dom';
import LandingShell from '../components/landing/LandingShell';
import { CREDIT_PACKAGES, CREDITS_PER_PROMPT, formatPrice } from '../types/plans';

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. You can upgrade as your campaign load increases and adapt package size when needed.'
  },
  {
    q: 'Do unused credits roll over forever?',
    a: 'Credits follow your billing window, so teams can plan spend predictably each cycle.'
  },
  {
    q: 'Is onboarding included?',
    a: 'Every plan includes setup guidance. Pro teams receive deeper workflow support.'
  }
];

export default function LandingPricingPage() {
  const navigate = useNavigate();

  return (
    <LandingShell activePath="/pricing">
      <section className="pr-wrap">
        <div className="pr-head">
          <p>Pricing</p>
          <h1>Scale from starter campaigns to high-volume creator outreach.</h1>
          <small>Each prompt consumes {CREDITS_PER_PROMPT} credits.</small>
        </div>

        <div className="pr-grid">
          {CREDIT_PACKAGES.map((pkg) => (
            <article key={pkg.id} className={pkg.popular ? 'popular' : ''}>
              {pkg.popular && <div className="tag">Most popular</div>}
              <h3>{pkg.label}</h3>
              <p className="price">{formatPrice(pkg.monthlyPrice)}<span>/month</span></p>
              <p className="muted">{pkg.credits} credits monthly</p>
              <p className="muted">{pkg.prompts} prompts</p>
              <button onClick={() => navigate('/signup')}>Start with this package</button>
            </article>
          ))}
        </div>

        <section className="pr-value">
          <h2>Why teams choose CollabFree pricing</h2>
          <div className="pr-value-grid">
            <article>
              <h3>Usage clarity</h3>
              <p>Every package maps prompts and credits clearly so campaign planning stays simple.</p>
            </article>
            <article>
              <h3>Team scalability</h3>
              <p>Move from pilot campaigns to full outreach operations without rebuilding your stack.</p>
            </article>
            <article>
              <h3>Predictable billing</h3>
              <p>Monthly structure keeps budget forecasting straightforward across teams and markets.</p>
            </article>
          </div>
        </section>

        <section className="pr-faq">
          <h2>Pricing FAQ</h2>
          <div className="pr-faq-grid">
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
        .pr-wrap { max-width: 1180px; margin: 0 auto; padding: 62px 20px 10px; }
        .pr-head p { color: #d45f22; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: .08em; margin-bottom: 10px; }
        .pr-head h1 { font-size: clamp(34px, 5.2vw, 58px); line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 10px; max-width: 900px; }
        .pr-head small { color: #6f5b4d; font-size: 14px; font-weight: 700; }
        .pr-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .pr-grid article { border: 1px solid #eddac7; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 10px 22px rgba(208, 167, 126, .12); }
        .pr-grid article.popular { border-color: #f5bd8f; box-shadow: 0 16px 30px rgba(228, 128, 65, .22); }
        .tag { width: fit-content; border: 1px solid #f4c59f; background: #fff1e1; color: #d36122; border-radius: 999px; padding: 4px 9px; font-size: 11px; font-weight: 800; margin-bottom: 8px; }
        .pr-grid h3 { font-size: 22px; margin-bottom: 6px; }
        .price { font-size: 35px; letter-spacing: -0.03em; font-weight: 800; margin-bottom: 8px; }
        .price span { font-size: 13px; color: #745f51; margin-left: 6px; }
        .muted { color: #6d594b; font-size: 14px; margin-bottom: 4px; font-weight: 700; }
        .pr-grid button { margin-top: 10px; width: 100%; border: 0; border-radius: 11px; padding: 10px; color: #fff; font-weight: 800; background: linear-gradient(135deg, #f67d24, #db4d23); cursor: pointer; }
        .pr-value { margin-top: 16px; border: 1px solid #eddac7; border-radius: 16px; background: #fff; padding: 16px; }
        .pr-value h2 { font-size: clamp(24px, 4vw, 36px); letter-spacing: -0.02em; margin-bottom: 12px; }
        .pr-value-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .pr-value-grid article { border: 1px solid #f1dfcd; border-radius: 12px; padding: 12px; background: #fffdf9; }
        .pr-value-grid h3 { font-size: 18px; margin-bottom: 6px; }
        .pr-value-grid p { color: #6b584a; line-height: 1.58; }
        .pr-faq { margin-top: 12px; border: 1px solid #eddac7; border-radius: 16px; background: linear-gradient(145deg, #fff, #fff7ee); padding: 16px; }
        .pr-faq h2 { font-size: clamp(24px, 4vw, 34px); letter-spacing: -0.02em; margin-bottom: 12px; }
        .pr-faq-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .pr-faq-grid article { border: 1px solid #f1decc; border-radius: 12px; padding: 12px; background: #fff; }
        .pr-faq-grid h3 { font-size: 17px; margin-bottom: 7px; }
        .pr-faq-grid p { color: #6b584a; line-height: 1.58; }
        @media (max-width: 980px) { .pr-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 980px) { .pr-value-grid, .pr-faq-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 720px) { .pr-grid, .pr-value-grid, .pr-faq-grid { grid-template-columns: 1fr; } }
      `}</style>
    </LandingShell>
  );
}
