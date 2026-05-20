import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserSmtpConfig,
  saveUserSmtpConfig,
  type UserSmtpConfig,
} from "../services/userSmtpConfig";

type TemplateDraft = {
  subject: string;
  body: string;
};

const TEMPLATE_STORAGE_KEY = "collabfree:campaign-template";

const defaultTemplate: TemplateDraft = {
  subject: "Partnership opportunity with {{name}}",
  body: "Hi {{name}},\n\nWe are launching a new campaign and would love to collaborate with you. If you are open, I can share the full brief and timelines.\n\nBest,\nCollabFree Team",
};

export default function InboxPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [draft, setDraft] = useState<TemplateDraft>(defaultTemplate);
  const [status, setStatus] = useState("");
  const [previewName, setPreviewName] = useState("Creator");
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState("");
  const [smtpNotice, setSmtpNotice] = useState("");
  const [smtpConfig, setSmtpConfig] = useState<UserSmtpConfig | null>(null);
  const [smtpDraft, setSmtpDraft] = useState({
    enabled: false,
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
  });

  useEffect(() => {
    const rawTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!rawTemplate) return;

    try {
      const parsed = JSON.parse(rawTemplate) as Partial<TemplateDraft>;
      setDraft({
        subject: parsed.subject?.trim() || defaultTemplate.subject,
        body: parsed.body?.trim() || defaultTemplate.body,
      });
    } catch {
      setDraft(defaultTemplate);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setSmtpLoading(true);
      setSmtpError("");
      try {
        const config = await fetchUserSmtpConfig(user.uid);
        setSmtpConfig(config);
        setSmtpDraft({
          enabled: config.enabled,
          host: config.host,
          port: config.port,
          secure: config.secure,
          username: config.username,
          password: "",
          fromEmail: config.fromEmail,
          fromName: config.fromName,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load SMTP config";
        setSmtpError(message);
      } finally {
        setSmtpLoading(false);
      }
    };

    void load();
  }, [user]);

  const previewMessage = useMemo(
    () =>
      draft.body.replace(/{{\s*name\s*}}/gi, previewName || "Creator").trim(),
    [draft.body, previewName],
  );

  const saveTemplate = () => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(draft));
    setStatus("Template saved for Builder contact flow.");
    window.setTimeout(() => setStatus(""), 2500);
  };

  const applyToBuilder = () => {
    saveTemplate();
    navigate("/builder?step=4");
  };

  const saveSmtp = async () => {
    if (!user) return;

    setSmtpSaving(true);
    setSmtpError("");
    setSmtpNotice("");
    try {
      const result = await saveUserSmtpConfig({
        userId: user.uid,
        enabled: smtpDraft.enabled,
        host: smtpDraft.host,
        port: smtpDraft.port,
        secure: smtpDraft.secure,
        username: smtpDraft.username,
        password: smtpDraft.password || undefined,
        fromEmail: smtpDraft.fromEmail,
        fromName: smtpDraft.fromName,
      });

      setSmtpConfig((prev) =>
        prev
          ? {
              ...prev,
              enabled: result.enabled,
              configured: result.configured,
              hasPassword: result.hasPassword,
            }
          : {
              configured: result.configured,
              enabled: result.enabled,
              host: smtpDraft.host,
              port: smtpDraft.port,
              secure: smtpDraft.secure,
              username: smtpDraft.username,
              fromEmail: smtpDraft.fromEmail,
              fromName: smtpDraft.fromName,
              hasPassword: result.hasPassword,
              updatedAt: null,
            },
      );
      setSmtpDraft((prev) => ({ ...prev, password: "" }));
      setSmtpNotice("SMTP configuration saved and ready for Builder.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save SMTP config";
      setSmtpError(message);
    } finally {
      setSmtpSaving(false);
    }
  };

  const smtpReady = smtpConfig?.configured && smtpConfig.enabled;

  return (
    <div className="inbox-page">
      <aside className="inbox-side">
        <button
          className="inbox-brand"
          onClick={() => navigate("/dashboard?section=inbox")}
        >
          <Sparkles size={18} />
          <span>CollabFree Inbox</span>
        </button>

        <div className="inbox-nav-card">
          <div>
            <strong>Campaign inbox</strong>
            <p>Design email templates and connect SMTP once.</p>
          </div>
          <button onClick={() => navigate("/builder?step=4")}>
            <Send size={14} /> Open Builder contact step
          </button>
        </div>

        <div className={`inbox-status ${smtpReady ? "ready" : "pending"}`}>
          <ShieldCheck size={18} />
          <div>
            <strong>
              {smtpReady ? "SMTP ready" : "SMTP not fully configured"}
            </strong>
            <p>
              {smtpReady
                ? "Builder can send using your saved SMTP details."
                : "Save SMTP settings here, then use them in Builder."}
            </p>
          </div>
        </div>
      </aside>

      <main className="inbox-main">
        <header className="inbox-header">
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard?section=inbox")}
          >
            <ArrowLeft size={14} /> Dashboard inbox
          </button>
          <div>
            <h1>Inbox Workspace</h1>
            <p>
              Build reusable campaign templates and SMTP settings in one place.
            </p>
          </div>
        </header>

        <section className="inbox-grid">
          <article className="panel template-panel">
            <div className="panel-head">
              <h2>Email template</h2>
              <button className="ghost-btn" onClick={saveTemplate}>
                <Check size={14} /> Save template
              </button>
            </div>

            <label>
              Subject
              <input
                value={draft.subject}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Partnership opportunity with {{name}}"
              />
            </label>

            <label>
              Body
              <textarea
                value={draft.body}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, body: event.target.value }))
                }
                placeholder="Write a reusable campaign message..."
              />
            </label>

            <label>
              Preview creator name
              <input
                value={previewName}
                onChange={(event) => setPreviewName(event.target.value)}
                placeholder="Creator"
              />
            </label>

            <div className="template-preview">
              <Mail size={16} />
              <div>
                <strong>{draft.subject || defaultTemplate.subject}</strong>
                <p>{previewMessage || defaultTemplate.body}</p>
              </div>
            </div>

            <div className="inline-actions">
              <button className="primary-btn" onClick={applyToBuilder}>
                Use in Builder
              </button>
              <button className="ghost-btn" onClick={saveTemplate}>
                Save locally
              </button>
            </div>

            {status && <div className="notice">{status}</div>}
          </article>

          <article className="panel smtp-panel">
            <div className="panel-head">
              <h2>SMTP config</h2>
              <button
                className="ghost-btn"
                onClick={() => navigate("/dashboard?section=inbox")}
              >
                <SlidersHorizontal size={14} /> View inbox tab
              </button>
            </div>

            {smtpLoading ? (
              <div className="loader-card">
                <Loader2 size={22} className="spin" />
                <p>Loading your SMTP settings...</p>
              </div>
            ) : (
              <>
                <label>
                  Enable SMTP
                  <select
                    value={smtpDraft.enabled ? "yes" : "no"}
                    onChange={(event) =>
                      setSmtpDraft((prev) => ({
                        ...prev,
                        enabled: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="no">Use project email</option>
                    <option value="yes">Use my SMTP</option>
                  </select>
                </label>

                <div className="two-col">
                  <label>
                    Host
                    <input
                      value={smtpDraft.host}
                      onChange={(event) =>
                        setSmtpDraft((prev) => ({
                          ...prev,
                          host: event.target.value,
                        }))
                      }
                      placeholder="smtp.gmail.com"
                    />
                  </label>
                  <label>
                    Port
                    <input
                      type="number"
                      value={smtpDraft.port}
                      onChange={(event) =>
                        setSmtpDraft((prev) => ({
                          ...prev,
                          port: Number(event.target.value) || 587,
                        }))
                      }
                    />
                  </label>
                </div>

                <label>
                  Username
                  <input
                    value={smtpDraft.username}
                    onChange={(event) =>
                      setSmtpDraft((prev) => ({
                        ...prev,
                        username: event.target.value,
                      }))
                    }
                    placeholder="you@yourdomain.com"
                  />
                </label>

                <div className="two-col">
                  <label>
                    From email
                    <input
                      value={smtpDraft.fromEmail}
                      onChange={(event) =>
                        setSmtpDraft((prev) => ({
                          ...prev,
                          fromEmail: event.target.value,
                        }))
                      }
                      placeholder="you@yourdomain.com"
                    />
                  </label>
                  <label>
                    From name
                    <input
                      value={smtpDraft.fromName}
                      onChange={(event) =>
                        setSmtpDraft((prev) => ({
                          ...prev,
                          fromName: event.target.value,
                        }))
                      }
                      placeholder="CollabFree Team"
                    />
                  </label>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={smtpDraft.secure}
                    onChange={(event) =>
                      setSmtpDraft((prev) => ({
                        ...prev,
                        secure: event.target.checked,
                      }))
                    }
                  />
                  Use secure TLS
                </label>

                <label>
                  Password or app password
                  <input
                    type="password"
                    value={smtpDraft.password}
                    onChange={(event) =>
                      setSmtpDraft((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder={
                      smtpConfig?.hasPassword
                        ? "Saved password exists"
                        : "Enter password"
                    }
                  />
                </label>

                <div className="inline-actions">
                  <button
                    className="primary-btn"
                    onClick={saveSmtp}
                    disabled={smtpSaving}
                  >
                    {smtpSaving ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Settings size={15} />
                    )}
                    {smtpSaving ? "Saving..." : "Save SMTP"}
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() => navigate("/builder?step=4")}
                  >
                    Open Builder contact
                  </button>
                </div>

                {smtpError && <div className="error-box">{smtpError}</div>}
                {smtpNotice && <div className="notice">{smtpNotice}</div>}
              </>
            )}
          </article>
        </section>
      </main>

      <style>{`
        .inbox-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 290px 1fr;
          background: linear-gradient(135deg, #fff9f2 0%, #fff 45%, #fff4ea 100%);
          color: #261d16;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .inbox-side {
          padding: 24px;
          border-right: 1px solid #f0ddca;
          background: rgba(255, 251, 247, 0.88);
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .inbox-brand,
        .inbox-nav-card button,
        .back-btn,
        .ghost-btn,
        .primary-btn {
          border: 0;
          cursor: pointer;
        }

        .inbox-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          font-size: 18px;
          font-weight: 900;
          color: #1f1712;
          width: fit-content;
        }

        .inbox-brand svg { color: #ef6d25; }

        .inbox-nav-card {
          border: 1px solid #f1ddc8;
          background: #fff;
          border-radius: 18px;
          padding: 16px;
          display: grid;
          gap: 12px;
          box-shadow: 0 12px 24px rgba(197, 149, 106, 0.1);
        }

        .inbox-nav-card strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .inbox-nav-card p,
        .inbox-status p,
        .inbox-header p,
        .template-preview p {
          color: #7a6555;
          font-size: 13px;
          line-height: 1.5;
        }

        .inbox-nav-card button {
          border-radius: 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .inbox-status {
          border-radius: 16px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border: 1px solid #f1ddc8;
          background: #fff;
        }

        .inbox-status.ready {
          background: linear-gradient(135deg, #fffaf2, #fff);
        }

        .inbox-status.pending {
          background: linear-gradient(135deg, #fff8f3, #fff);
        }

        .inbox-status svg { color: #ef6d25; flex-shrink: 0; }

        .inbox-status strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .inbox-main {
          padding: 28px;
          display: grid;
          gap: 18px;
        }

        .inbox-header {
          background: #fff;
          border: 1px solid #f2dfce;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 10px 22px rgba(197, 149, 106, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .inbox-header h1 {
          font-size: clamp(26px, 3vw, 36px);
          margin-bottom: 4px;
          letter-spacing: -0.03em;
        }

        .back-btn {
          background: #fff7ef;
          border: 1px solid #f2deca;
          border-radius: 12px;
          padding: 10px 14px;
          color: #6d584b;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }

        .inbox-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 14px;
        }

        .panel {
          border: 1px solid #efddca;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 12px 30px rgba(197, 149, 106, 0.1);
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.02em;
        }

        .panel label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #4f3f32;
        }

        .panel input,
        .panel textarea,
        .panel select {
          width: 100%;
          border: 1px solid #e7d7c7;
          border-radius: 12px;
          background: #fffefb;
          padding: 11px 12px;
          font: inherit;
          color: #261d16;
        }

        .panel textarea {
          min-height: 150px;
          resize: vertical;
        }

        .two-col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .checkbox-row {
          display: flex !important;
          align-items: center;
          gap: 10px;
        }

        .checkbox-row input {
          width: auto;
        }

        .template-preview {
          border: 1px solid #f2ddc8;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 12px;
          background: linear-gradient(135deg, #fffaf4, #fff);
        }

        .template-preview strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .inline-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .primary-btn,
        .ghost-btn {
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .primary-btn {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
        }

        .ghost-btn {
          background: #fff7ef;
          border: 1px solid #f2deca;
          color: #7b5c40;
        }

        .notice,
        .error-box {
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
        }

        .notice {
          background: #fff7ef;
          border: 1px solid #f2d9c0;
          color: #8a5a35;
        }

        .error-box {
          background: #fff3f3;
          border: 1px solid #efc9c9;
          color: #a54343;
        }

        .loader-card {
          min-height: 220px;
          display: grid;
          place-content: center;
          gap: 10px;
          text-align: center;
          color: #7b6556;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1120px) {
          .inbox-page {
            grid-template-columns: 1fr;
          }

          .inbox-side {
            border-right: 0;
            border-bottom: 1px solid #f0ddca;
          }

          .inbox-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .inbox-main {
            padding: 14px;
          }

          .inbox-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
