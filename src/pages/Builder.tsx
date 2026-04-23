import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CreatorProfile, fetchCreatorProfiles, profileMeta, autoRecommendCreators } from '../services/creatorDataService';
import {
  CampaignEmailLog,
  fetchCampaignInbox,
  parseRecipientList,
  sendBulkEmails
} from '../services/brevoEmail';

type StepId = 1 | 2 | 3 | 4 | 5;

interface UserCredits {
  credits: number;
  maxCredits: number;
}

interface BuilderDraft {
  productDescription: string;
  productUrl: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram';
  language: string;
  discoverCount: number;
  regions: string[];
  followerRange: number;
  hasEmail: boolean;
  hashtags: string;
  influencerInput: string;
  messageTemplate: string;
}

const defaultOutreachTemplate =
  'Hi {{name}},\n\nWe are launching a new campaign and would love to collaborate with you. If you are open, I can share the full brief and timelines.\n\nBest,\nCollabFree Team';

const stepLabels: Array<{ id: StepId; label: string }> = [
  { id: 1, label: 'Set Up' },
  { id: 2, label: 'Add Hashtags' },
  { id: 3, label: 'Shortlist Influencers' },
  { id: 4, label: 'Contact All' },
  { id: 5, label: 'Check Replies' }
];

export default function Builder() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState<StepId>(1);
  const [credits, setCredits] = useState<UserCredits>({ credits: 0, maxCredits: 0 });

  const [productDescription, setProductDescription] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [platform, setPlatform] = useState<'YouTube' | 'TikTok' | 'Instagram'>('YouTube');
  const [language, setLanguage] = useState('English');
  const [discoverCount, setDiscoverCount] = useState(20);
  const [regions, setRegions] = useState<string[]>([]);
  const [followerRange, setFollowerRange] = useState(50000);
  const [hasEmail, setHasEmail] = useState(true);
  const [hashtags, setHashtags] = useState('');
  const [influencerInput, setInfluencerInput] = useState('');
  const [creatorResults, setCreatorResults] = useState<CreatorProfile[]>([]);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(defaultOutreachTemplate);
  const [emailSubject, setEmailSubject] = useState('Partnership opportunity with {{name}}');
  const [recipientInput, setRecipientInput] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkSendStatus, setBulkSendStatus] = useState('');
  const [inboxActivity, setInboxActivity] = useState<CampaignEmailLog[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project'));
  const [projectStatus, setProjectStatus] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    if (!user) return;

    const hydrate = async () => {
      const { data } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (!data) return;
      setCredits({
        credits: data.credits_remaining || data.credits || 0,
        maxCredits: data.max_credits || data.total_credits || 0
      });
    };

    void hydrate();

    const channel = supabase
      .channel(`builder-user-${user.uid}`)
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
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const queryProjectId = searchParams.get('project');
    setProjectId(queryProjectId);

    if (!user || !queryProjectId) {
      setProjectStatus('');
      return;
    }

    const loadProject = async () => {
      setProjectStatus('Loading project...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', queryProjectId)
        .eq('user_id', user.uid)
        .maybeSingle();

      if (error || !data) {
        setProjectStatus('Unable to load that project.');
        return;
      }

      const files = Array.isArray(data.files) ? data.files : [];
      const draftFile = files.find((file: { name?: string }) => file?.name === 'campaign-draft.json');

      if (draftFile?.content) {
        try {
          const draft = JSON.parse(String(draftFile.content)) as Partial<BuilderDraft>;
          setProductDescription(draft.productDescription || data.first_prompt || '');
          setProductUrl(draft.productUrl || '');
          setPlatform(draft.platform || 'YouTube');
          setLanguage(draft.language || 'English');
          setDiscoverCount(typeof draft.discoverCount === 'number' ? draft.discoverCount : 20);
          setRegions(Array.isArray(draft.regions) ? draft.regions : []);
          setFollowerRange(typeof draft.followerRange === 'number' ? draft.followerRange : 50000);
          setHasEmail(typeof draft.hasEmail === 'boolean' ? draft.hasEmail : true);
          setHashtags(draft.hashtags || '');
          setInfluencerInput(draft.influencerInput || '');
          setMessageTemplate(draft.messageTemplate || defaultOutreachTemplate);
          setProjectStatus(`Editing: ${data.name || 'Untitled Project'}`);
          return;
        } catch {
          // Fall back to first prompt if draft JSON is malformed.
        }
      }

      setProductDescription(data.first_prompt || '');
      setProjectStatus(`Editing: ${data.name || 'Untitled Project'}`);
    };

    void loadProject();
  }, [searchParams, user]);

  useEffect(() => {
    const stepValue = Number(searchParams.get('step'));
    if ([1, 2, 3, 4, 5].includes(stepValue)) {
      setStep(stepValue as StepId);
    }
  }, [searchParams]);

  const handleAutoRecommend = async () => {
    setCreatorError('');
    setCreatorLoading(true);
    setCreatorResults([]);

    try {
      const results = await autoRecommendCreators(platform, productDescription, hashtags);
      if (results.length === 0) {
        setCreatorError('No recommendations found. Try adding more specific hashtags or product description.');
      }
      setCreatorResults(results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Recommendation lookup failed';
      setCreatorError(message);
    } finally {
      setCreatorLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3 && creatorResults.length === 0 && !creatorLoading) {
      handleAutoRecommend();
    }
  }, [step]);

  const parsedInfluencers = useMemo(
    () => influencerInput.split('\n').map((line) => line.trim()).filter(Boolean),
    [influencerInput]
  );

  const parsedRecipients = useMemo(() => parseRecipientList(recipientInput), [recipientInput]);

  const sentEmails = useMemo(
    () => inboxActivity.filter((item) => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(item.status)).length,
    [inboxActivity]
  );

  const failedEmails = useMemo(
    () => inboxActivity.filter((item) => ['failed', 'bounced', 'deferred'].includes(item.status)).length,
    [inboxActivity]
  );

  const repliedEmails = useMemo(
    () => inboxActivity.filter((item) => item.status === 'replied').length,
    [inboxActivity]
  );

  const completion = useMemo(() => (step / stepLabels.length) * 100, [step]);
  const usagePercent = credits.maxCredits > 0 ? Math.min(100, (credits.credits / credits.maxCredits) * 100) : 0;

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((item) => item !== region) : [...prev, region]));
  };

  const nextStep = () => setStep((prev) => (prev < 5 ? ((prev + 1) as StepId) : prev));
  const prevStep = () => setStep((prev) => (prev > 1 ? ((prev - 1) as StepId) : prev));

  const addToShortlist = (profile: CreatorProfile) => {
    const current = influencerInput

      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!current.includes(profile.handle)) {
      setInfluencerInput([...current, profile.handle].join('\n'));
    }
  };

  const buildDraft = (): BuilderDraft => ({
    productDescription,
    productUrl,
    platform,
    language,
    discoverCount,
    regions,
    followerRange,
    hasEmail,
    hashtags,
    influencerInput,
    messageTemplate
  });

  const persistProject = async (markLaunched = false): Promise<boolean> => {
    if (!user) return false;

    setSavingProject(true);
    const now = new Date().toISOString();
    const draft = buildDraft();
    const projectName = productDescription.trim()
      ? productDescription.trim().slice(0, 58)
      : `Campaign ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const payload = {
      user_id: user.uid,
      name: markLaunched ? `${projectName} (Launched)` : projectName,
      first_prompt: productDescription,
      files: [
        {
          name: 'campaign-draft.json',
          content: JSON.stringify(draft)
        }
      ],
      last_modified: now
    };

    try {
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', projectId)
          .eq('user_id', user.uid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;

        if (data?.id) {
          setProjectId(data.id);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('project', data.id);
          setSearchParams(nextParams);
        }
      }

      setProjectStatus(markLaunched ? 'Campaign launched and saved.' : 'Draft saved.');
      return true;
    } catch (error) {
      console.error('Failed to save campaign project:', error);
      setProjectStatus('Could not save right now. Try again.');
      return false;
    } finally {
      setSavingProject(false);
    }
  };

  const handleLaunchCampaign = async () => {
    const saved = await persistProject(true);
    if (saved) {
      navigate('/dashboard');
    }
  };

  const refreshInbox = async () => {
    if (!user) return;

    setInboxLoading(true);
    setInboxError('');
    try {
      const rows = await fetchCampaignInbox(user.uid, projectId || undefined);
      setInboxActivity(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load inbox activity';
      setInboxError(message);
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refreshInbox();
  }, [user, projectId]);

  const handleSendBulkEmails = async () => {
    if (!user) return;

    if (!emailSubject.trim()) {
      setBulkSendStatus('Add an email subject before sending.');
      return;
    }

    if (!messageTemplate.trim()) {
      setBulkSendStatus('Add a message template before sending.');
      return;
    }

    if (parsedRecipients.length === 0) {
      setBulkSendStatus('Add at least one valid recipient email.');
      return;
    }

    setSendingBulk(true);
    setBulkSendStatus('');

    try {
      const result = await sendBulkEmails({
        userId: user.uid,
        projectId,
        senderEmail: user.email || undefined,
        senderName: user.displayName || 'CollabFree Team',
        subject: emailSubject,
        messageTemplate,
        recipients: parsedRecipients
      });

      setBulkSendStatus(`Sent ${result.sentCount}/${result.total}. Failed: ${result.failedCount}.`);
      await refreshInbox();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk send failed';
      setBulkSendStatus(message);
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="ec-builder-page">
      <aside className="ec-builder-sidebar">
        <button className="ec-builder-brand" onClick={() => navigate('/dashboard')}>
          <Sparkles size={17} />
          <span>CollabFree</span>
        </button>

        <div className="ec-builder-menu">
          <button className="active"><Search size={15} /> Search</button>
          <button><Users size={15} /> Manage</button>
          <button><MessageSquare size={15} /> Email</button>
        </div>

        <div className="ec-builder-card">
          <p>Credit Usage</p>
          <strong>{credits.credits} / {credits.maxCredits} credits</strong>
          <div className="bar"><span style={{ width: `${usagePercent}%` }} /></div>
        </div>
      </aside>

      <main className="ec-builder-main">
        <header className="ec-builder-head">
          <button className="back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="ec-builder-title">
            <h1>Quick Search Campaign</h1>
            <p>Complete each page to launch your outreach workflow.</p>
            {projectStatus && <small className="ec-project-status">{projectStatus}</small>}
          </div>
        </header>

        <section className="ec-stepper">
          {stepLabels.map((item) => (
            <button
              key={item.id}
              className={`ec-step ${item.id === step ? 'active' : ''} ${item.id < step ? 'done' : ''}`}
              onClick={() => setStep(item.id)}
            >
              <span>{item.id < step ? <Check size={12} /> : item.id}</span>
              {item.label}
            </button>
          ))}
        </section>

        <div className="ec-progress"><span style={{ width: `${completion}%` }} /></div>

        <section className="ec-workspace">
          {step === 1 && (
            <div className="ec-form-grid">
              <label>
                Describe your product or ideal influencer
                <textarea
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  placeholder="Example: AI startup tool for productivity, looking for tech creators in English speaking markets."
                />
              </label>

              <label>
                Product URL
                <input
                  type="url"
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="https://yourbrand.com"
                />
              </label>

              <label>
                Platform
                <div className="ec-pill-row">
                  {(['YouTube', 'TikTok', 'Instagram'] as const).map((item) => (
                    <button
                      key={item}
                      className={platform === item ? 'selected' : ''}
                      onClick={() => setPlatform(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Language
                <input value={language} onChange={(event) => setLanguage(event.target.value)} />
              </label>

              <label>
                Number of influencers to discover
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={discoverCount}
                  onChange={(event) => setDiscoverCount(Number(event.target.value) || 1)}
                />
              </label>

              <label>
                Regions
                <div className="ec-pill-row">
                  {['Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania'].map((item) => (
                    <button
                      key={item}
                      className={regions.includes(item) ? 'selected' : ''}
                      onClick={() => toggleRegion(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Follower range (max)
                <input
                  type="range"
                  min={10000}
                  max={500000}
                  step={10000}
                  value={followerRange}
                  onChange={(event) => setFollowerRange(Number(event.target.value))}
                />
                <small>Up to {followerRange.toLocaleString()} followers</small>
              </label>

              <label className="ec-checkbox">
                <input
                  type="checkbox"
                  checked={hasEmail}
                  onChange={(event) => setHasEmail(event.target.checked)}
                />
                Include influencers with public email
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="ec-step-card">
              <h2>Add hashtags for search quality</h2>
              <p>Use comma-separated tags. These will be applied to your campaign query.</p>
              <textarea
                value={hashtags}
                onChange={(event) => setHashtags(event.target.value)}
                placeholder="#fintech,#saas,#productivity"
              />
            </div>
          )}

          {step === 3 && (
            <div className="ec-step-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Recommended Influencers</h2>
                <button type="button" onClick={handleAutoRecommend} disabled={creatorLoading} className="ec-refresh-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: '#fff', border: '1px solid #e8d8c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {creatorLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  {creatorLoading ? 'Generating...' : 'Refresh Recommendations'}
                </button>
              </div>
              <p>Based on your campaign details, here are some suggested {platform} creators to shortlist.</p>

              {creatorError && <div className="ec-lookup-error">{creatorError}</div>}

              {creatorResults.length > 0 && (
                <div className="ec-results-grid">
                  {creatorResults.map((profile) => (
                    <article key={profile.id}>
                      <div className="head">
                        <div>
                          <h3>{profile.displayName}</h3>
                          <p>{profile.handle}</p>
                        </div>
                        {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.displayName} />}
                      </div>
                      <small>{profileMeta(profile)}</small>
                      {profile.bio && <p className="bio">{profile.bio}</p>}
                      <div className="actions">
                        <button type="button" onClick={() => addToShortlist(profile)}>Add to shortlist</button>
                        {profile.profileUrl && (
                          <a href={profile.profileUrl} target="_blank" rel="noreferrer">
                            Open
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <p>Manual mode: paste one influencer handle/name per line.</p>
              <textarea
                value={influencerInput}
                onChange={(event) => setInfluencerInput(event.target.value)}
                placeholder="@creator_one\n@creator_two\n@creator_three"
              />
              <div className="ec-template-preview">
                <Users size={16} />
                <span>{parsedInfluencers.length} shortlisted</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="ec-step-card">
              <h2>Contact all shortlisted influencers</h2>
              <p>
                Add recipients, compose a reusable message, and send bulk emails via Brevo.
                Use placeholders like {'{{name}}'} in subject/body.
              </p>

              <label>
                Email subject
                <input
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="Partnership opportunity with {{name}}"
                />
              </label>

              <label>
                Recipients (one per line)
                <textarea
                  value={recipientInput}
                  onChange={(event) => setRecipientInput(event.target.value)}
                  placeholder={"Jane Creator <jane@creator.com>\ncreator.two@domain.com"}
                />
              </label>

              <textarea
                value={messageTemplate}
                onChange={(event) => setMessageTemplate(event.target.value)}
              />

              <div className="ec-template-preview">
                <Mail size={16} />
                <span>Template ready for {parsedRecipients.length} email recipients</span>
              </div>

              <div className="ec-inline-actions">
                <button type="button" className="ec-send-btn" onClick={handleSendBulkEmails} disabled={sendingBulk}>
                  {sendingBulk ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                  {sendingBulk ? 'Sending...' : 'Send Bulk Emails'}
                </button>
                <button type="button" className="ec-refresh-btn" onClick={() => void refreshInbox()} disabled={inboxLoading}>
                  {inboxLoading ? 'Refreshing...' : 'Refresh Inbox'}
                </button>
              </div>

              {bulkSendStatus && <div className="ec-send-status">{bulkSendStatus}</div>}
            </div>
          )}

          {step === 5 && (
            <div className="ec-step-card">
              <h2>Reply tracking summary</h2>
              <p>This page combines your outgoing sends, delivery events, and inbox-style status updates.</p>

              {inboxError && <div className="ec-lookup-error">{inboxError}</div>}

              <div className="ec-reply-grid">
                <article>
                  <h3>Emails Sent</h3>
                  <strong>{sentEmails}</strong>
                </article>
                <article>
                  <h3>Replies</h3>
                  <strong>{repliedEmails}</strong>
                </article>
                <article>
                  <h3>Failed / Bounced</h3>
                  <strong>{failedEmails}</strong>
                </article>
              </div>

              <div className="ec-log-list">
                {inboxLoading && <p className="ec-muted">Loading inbox activity...</p>}
                {!inboxLoading && inboxActivity.length === 0 && (
                  <p className="ec-muted">No email activity yet. Send a bulk email in Step 4 to populate this inbox.</p>
                )}
                {inboxActivity.slice(0, 12).map((row) => (
                  <article key={row.id} className="ec-log-item">
                    <div>
                      <strong>{row.recipient_name || row.recipient_email}</strong>
                      <p>{row.subject || 'No subject'}</p>
                    </div>
                    <div className={`ec-status ${row.status}`}>{row.status}</div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className="ec-builder-footer">
          <button className="ghost" onClick={() => void persistProject(false)} disabled={savingProject}>
            {savingProject ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="ghost" onClick={prevStep} disabled={step === 1}>Previous</button>
          {step < 5 ? (
            <button className="primary" onClick={nextStep}>
              Next
              <ArrowRight size={15} />
            </button>
          ) : (
            <button className="primary" onClick={() => void handleLaunchCampaign()} disabled={savingProject}>
              <Send size={15} />
              {savingProject ? 'Launching...' : 'Launch Campaign'}
            </button>
          )}
        </footer>
      </main>

      <style>{`
        .ec-builder-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 260px 1fr;
          background: #f7f3ee;
          color: #201a16;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .ec-builder-sidebar {
          background: #f2ece6;
          border-right: 1px solid #e6d7c9;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ec-builder-brand {
          border: 0;
          background: transparent;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-size: 19px;
          font-weight: 800;
          cursor: pointer;
        }

        .ec-builder-brand svg { color: #f57c26; }

        .ec-builder-menu {
          display: grid;
          gap: 8px;
        }

        .ec-builder-menu button {
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          color: #57483d;
          font-weight: 700;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-align: left;
        }

        .ec-builder-menu button.active,
        .ec-builder-menu button:hover {
          border-color: #e8cdb4;
          background: #fff;
        }

        .ec-builder-card {
          margin-top: auto;
          background: #fff;
          border: 1px solid #e8d8c7;
          border-radius: 12px;
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .ec-builder-card p {
          font-size: 12px;
          color: #776353;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .ec-builder-card strong { font-size: 14px; }

        .ec-builder-card .bar {
          height: 6px;
          background: #f7e8d7;
          border-radius: 999px;
          overflow: hidden;
        }

        .ec-builder-card .bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #f5862f, #df5726);
        }

        .ec-builder-main {
          padding: 22px;
          display: grid;
          grid-template-rows: auto auto auto 1fr auto;
          gap: 12px;
        }

        .ec-builder-head {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #ebddcf;
          border-radius: 14px;
          padding: 14px;
        }

        .ec-builder-head .back {
          border: 1px solid #ead8c7;
          border-radius: 10px;
          padding: 8px 10px;
          background: #fff;
          color: #614f41;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-builder-title h1 {
          font-size: clamp(24px, 3vw, 36px);
          margin-bottom: 4px;
        }

        .ec-builder-title p { color: #705f50; }

        .ec-project-status {
          display: inline-flex;
          margin-top: 6px;
          color: #8a6e5b;
          font-size: 12px;
          font-weight: 700;
        }

        .ec-stepper {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }

        .ec-step {
          border: 1px solid #eadaca;
          border-radius: 12px;
          padding: 10px;
          background: #fff;
          color: #665446;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          justify-content: center;
        }

        .ec-step span {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #f6eee5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .ec-step.active {
          border-color: #f5b787;
          color: #d05b1f;
        }

        .ec-step.active span,
        .ec-step.done span {
          background: #f57624;
          color: #fff;
        }

        .ec-step.done {
          border-color: #f2c8a5;
        }

        .ec-progress {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #f1e3d5;
          overflow: hidden;
        }

        .ec-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #f47b24, #df5024);
          transition: width 0.25s ease;
        }

        .ec-workspace {
          background: #fff;
          border: 1px solid #eadacb;
          border-radius: 16px;
          padding: 16px;
          overflow: auto;
          animation: fade-up 0.4s ease;
        }

        .ec-lookup-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ec-lookup-row input {
          width: 100%;
          border: 1px solid #e8d9ca;
          border-radius: 10px;
          padding: 10px;
          background: #fffefb;
          font-family: inherit;
          font-size: 14px;
        }

        .ec-lookup-row button {
          border: 0;
          border-radius: 10px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f57b24, #df5124);
          color: #fff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-lookup-row button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ec-lookup-error {
          border: 1px solid #f2c1c1;
          background: #fff3f3;
          color: #b53c3c;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .ec-results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ec-results-grid article {
          border: 1px solid #ead7c6;
          border-radius: 12px;
          background: #fffdf9;
          padding: 11px;
          display: grid;
          gap: 8px;
        }

        .ec-results-grid .head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .ec-results-grid h3 {
          font-size: 16px;
          margin-bottom: 2px;
        }

        .ec-results-grid .head p {
          color: #6d5c4f;
          font-size: 13px;
          font-weight: 700;
        }

        .ec-results-grid img {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #e8d9ca;
        }

        .ec-results-grid small {
          font-size: 12px;
          color: #7c6657;
          font-weight: 700;
        }

        .ec-results-grid .bio {
          color: #6a584b;
          font-size: 13px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ec-results-grid .actions {
          display: flex;
          gap: 8px;
        }

        .ec-results-grid .actions button,
        .ec-results-grid .actions a {
          border-radius: 9px;
          padding: 7px 9px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .ec-results-grid .actions button {
          border: 0;
          background: #f57c24;
          color: #fff;
          cursor: pointer;
        }

        .ec-results-grid .actions a {
          border: 1px solid #e5d5c7;
          color: #6b584b;
          background: #fff;
        }

        .ec-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ec-form-grid label,
        .ec-step-card {
          display: grid;
          gap: 8px;
          color: #4f3f32;
          font-weight: 700;
          font-size: 14px;
        }

        textarea,
        input {
          width: 100%;
          border: 1px solid #e6d7c8;
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #2b221d;
          background: #fffefb;
        }

        textarea {
          min-height: 106px;
          resize: vertical;
        }

        input[type='range'] {
          padding: 0;
          accent-color: #f07125;
        }

        .ec-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ec-pill-row button {
          border: 1px solid #e7d4bf;
          border-radius: 999px;
          background: #fff;
          color: #6c5849;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ec-pill-row button.selected {
          background: #f47523;
          border-color: #f47523;
          color: #fff;
        }

        .ec-checkbox {
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 8px;
        }

        .ec-checkbox input {
          width: 16px;
          height: 16px;
        }

        .ec-step-card h2 {
          font-size: clamp(24px, 3vw, 30px);
          letter-spacing: -0.02em;
        }

        .ec-step-card p {
          color: #735f50;
          font-weight: 600;
        }

        .ec-template-preview {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #edd5be;
          background: #fff8ef;
          color: #cd6021;
          font-size: 13px;
        }

        .ec-inline-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .ec-send-btn,
        .ec-refresh-btn {
          border: 0;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .ec-send-btn {
          color: #fff;
          background: linear-gradient(135deg, #f47d21, #dc4f24);
        }

        .ec-refresh-btn {
          color: #634f41;
          border: 1px solid #e8d7c6;
          background: #fff;
        }

        .ec-send-btn:disabled,
        .ec-refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ec-send-status {
          margin-top: 10px;
          border: 1px solid #efdac4;
          border-radius: 10px;
          padding: 9px 10px;
          background: #fff7ee;
          color: #6f5a4c;
          font-size: 13px;
          font-weight: 700;
        }

        .ec-reply-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .ec-reply-grid article {
          border: 1px solid #ead8c6;
          border-radius: 12px;
          padding: 12px;
          background: #fffefb;
        }

        .ec-reply-grid h3 {
          font-size: 14px;
          color: #7b6656;
          margin-bottom: 6px;
        }

        .ec-reply-grid strong {
          font-size: 24px;
          letter-spacing: -0.03em;
        }

        .ec-log-list {
          margin-top: 12px;
          display: grid;
          gap: 8px;
        }

        .ec-log-item {
          border: 1px solid #ecdbc9;
          border-radius: 12px;
          background: #fffefb;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ec-log-item strong {
          font-size: 14px;
          color: #32271f;
        }

        .ec-log-item p {
          margin-top: 2px;
          color: #766255;
          font-size: 12px;
        }

        .ec-muted {
          color: #7b6657;
          font-size: 13px;
          font-weight: 600;
        }

        .ec-status {
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid #ead8c6;
          color: #715d4f;
          background: #fff;
        }

        .ec-status.sent,
        .ec-status.delivered,
        .ec-status.opened,
        .ec-status.clicked {
          border-color: #bfe7ce;
          color: #1f7a40;
          background: #ecfaf1;
        }

        .ec-status.replied {
          border-color: #bcd9ff;
          color: #1f5fa8;
          background: #edf4ff;
        }

        .ec-status.failed,
        .ec-status.bounced,
        .ec-status.deferred {
          border-color: #f2c7c7;
          color: #a53e3e;
          background: #fff3f3;
        }

        .ec-builder-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ec-builder-footer button {
          border: 0;
          border-radius: 11px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .ec-builder-footer .ghost {
          background: #fff;
          border: 1px solid #e8d8c7;
          color: #6a5647;
        }

        .ec-builder-footer .ghost:disabled,
        .ec-builder-footer .primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ec-builder-footer .ghost:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .ec-builder-footer .primary {
          background: linear-gradient(135deg, #f47d21, #dc4f24);
          color: #fff;
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
          .ec-builder-page {
            grid-template-columns: 1fr;
          }

          .ec-builder-sidebar {
            border-right: 0;
            border-bottom: 1px solid #e6d7c9;
          }

          .ec-builder-menu {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .ec-stepper {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .ec-builder-main {
            padding: 12px;
          }

          .ec-form-grid,
          .ec-stepper,
          .ec-reply-grid,
          .ec-builder-menu {
            grid-template-columns: 1fr;
          }

          .ec-results-grid {
            grid-template-columns: 1fr;
          }

          .ec-lookup-row {
            grid-template-columns: 1fr;
          }

          .ec-builder-footer {
            gap: 8px;
          }

          .ec-builder-footer button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}