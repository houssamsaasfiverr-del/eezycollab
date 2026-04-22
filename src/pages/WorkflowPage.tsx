import LandingShell from '../components/landing/LandingShell';

const steps = [
  {
    title: 'Set Up Campaign',
    desc: 'Define product angle, creator profile, platform focus, and market targets.'
  },
  {
    title: 'Add Hashtags',
    desc: 'Refine targeting with high-signal hashtags and campaign intent keywords.'
  },
  {
    title: 'Shortlist Influencers',
    desc: 'Review search output, validate fit, and build your active shortlist.'
  },
  {
    title: 'Contact in Batch',
    desc: 'Prepare personalized outreach templates and launch communication safely.'
  },
  {
    title: 'Track Replies',
    desc: 'Monitor conversation status and move interested creators to execution.'
  }
];

const workflowRules = [
  'Define campaign criteria before opening outreach.',
  'Shortlist only creators with clear content-fit evidence.',
  'Send outreach in controlled batches to protect quality.',
  'Track every response with a clear next action owner.'
];

export default function WorkflowPage() {
  return (
    <LandingShell activePath="/workflow">
      <section className="wf-wrap">
        <div className="wf-head">
          <p>Campaign Operating Flow</p>
          <h1>Run campaigns through a clear five-page pipeline.</h1>
        </div>

        <div className="wf-list">
          {steps.map((step, index) => (
            <article key={step.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="wf-rules">
          <h2>Operating principles for predictable campaign execution.</h2>
          <div className="wf-rules-grid">
            {workflowRules.map((rule) => (
              <article key={rule}>
                <span>Rule</span>
                <p>{rule}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wf-checklist">
          <h2>Launch checklist before hitting outreach.</h2>
          <ul>
            <li>Campaign objective and audience segments finalized</li>
            <li>Shortlist reviewed with team-ready notes</li>
            <li>Template includes personalization placeholders</li>
            <li>Reply ownership and follow-up timeline defined</li>
          </ul>
        </section>
      </section>

      <style>{`
        .wf-wrap { max-width: 1000px; margin: 0 auto; padding: 62px 20px 20px; }
        .wf-head p { color: #d35d21; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; margin-bottom: 10px; }
        .wf-head h1 { font-size: clamp(34px, 5vw, 58px); line-height: 1.06; letter-spacing: -0.03em; margin-bottom: 20px; }
        .wf-list { display: grid; gap: 10px; }
        .wf-list article { border: 1px solid #eddac7; background: #fff; border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start; }
        .wf-list span { min-width: 30px; width: 30px; height: 30px; border-radius: 999px; background: linear-gradient(135deg, #f67f24, #dc5023); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
        .wf-list h3 { font-size: 22px; margin-bottom: 6px; }
        .wf-list p { color: #675447; line-height: 1.65; }
        .wf-rules { margin-top: 14px; border: 1px solid #edd9c6; border-radius: 16px; background: #fff; padding: 16px; }
        .wf-rules h2 { font-size: clamp(24px, 4vw, 36px); letter-spacing: -0.02em; margin-bottom: 10px; }
        .wf-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .wf-rules-grid article { border: 1px solid #f1decc; border-radius: 12px; background: #fffdf9; padding: 12px; }
        .wf-rules-grid span { color: #c35e2f; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; font-weight: 800; }
        .wf-rules-grid p { color: #665446; margin-top: 5px; line-height: 1.58; }
        .wf-checklist { margin-top: 12px; border: 1px solid #edd9c6; border-radius: 16px; background: linear-gradient(140deg, #fff, #fff7ee); padding: 16px; }
        .wf-checklist h2 { font-size: clamp(24px, 4vw, 34px); letter-spacing: -0.02em; margin-bottom: 10px; }
        .wf-checklist ul { padding-left: 18px; display: grid; gap: 8px; color: #665446; line-height: 1.58; }
        @media (max-width: 760px) { .wf-rules-grid { grid-template-columns: 1fr; } }
      `}</style>
    </LandingShell>
  );
}
