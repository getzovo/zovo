'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ── Shared style tokens ──────────────────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
};

const fieldInput: React.CSSProperties = {
  width: '100%',
  background: '#111111',
  border: '1px solid #2A2A2A',
  padding: '14px 16px',
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: '#F5F5F0',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  width: '100%',
  background: '#FF4500',
  color: '#F5F5F0',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  fontWeight: 600,
  padding: '16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
};

const btnOutlined: React.CSSProperties = {
  width: '100%',
  background: '#111111',
  color: '#F5F5F0',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  fontWeight: 500,
  padding: '16px',
  borderRadius: 8,
  border: '1px solid #2A2A2A',
  cursor: 'pointer',
};

const skipLink: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: '#8A8786',
  textAlign: 'center',
  marginTop: 12,
  display: 'block',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
  fontWeight: 400,
  fontSize: 48,
  color: '#F5F5F0',
  lineHeight: 1.1,
  margin: '0 0 12px',
  letterSpacing: '0.02em',
};

const subtext: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 16,
  color: '#8A8786',
  margin: '0 0 32px',
  lineHeight: 1.6,
};

const cornerText: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
  position: 'fixed',
};

const GENRES = [
  'Hip-Hop', 'R&B', 'Pop', 'Country', 'EDM',
  'Latin', 'Indie', 'Electronic', 'Rock', 'Other',
];

const BOTTOM_RIGHT_LABELS: Record<number, string> = {
  1: 'ACCOUNT TYPE',
  2: 'YOUR ARTIST PROFILE',
  3: 'SPOTIFY CONNECT',
  4: 'CHOOSE YOUR PLAN',
  5: 'DISTRIBUTION SETUP',
  6: "YOU'RE IN.",
};

// ── Step 0 — Account type selection ──────────────────────────────────────────

type AccountType = 'artist' | 'manager' | 'label'

const ACCOUNT_TYPES: { type: AccountType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'artist',
    label: "I'M AN ARTIST",
    desc: 'Manage your own music career',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    type: 'manager',
    label: "I'M A MANAGER",
    desc: 'Manage a roster of artists',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    type: 'label',
    label: "I'M A LABEL",
    desc: 'Run a record label operation',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="12" rx="1" /><path d="M8 21V12M16 21V12" />
        <path d="M3 9l9-6 9 6" /><path d="M11 21v-4h2v4" />
      </svg>
    ),
  },
]

function Step0({ onSelect }: { onSelect: (type: AccountType) => void }) {
  const [selected, setSelected] = useState<AccountType | null>(null)

  function handlePick(type: AccountType) {
    setSelected(type)
    setTimeout(() => onSelect(type), 300)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ ...heading, fontSize: 56, marginBottom: 8 }}>How are you using Zovo?</h1>
        <p style={{ ...subtext, marginBottom: 0 }}>Choose your account type to get started</p>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {ACCOUNT_TYPES.map(({ type, label, desc, icon }) => {
          const active = selected === type
          return (
            <button
              key={type}
              onClick={() => handlePick(type)}
              style={{
                flex: 1,
                minWidth: 180,
                background: '#111111',
                border: active ? '1px solid #FF4500' : '1px solid #1A1A1A',
                borderRadius: 12,
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: active ? '0 0 20px rgba(255,69,0,0.15)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {icon}
              <div>
                <div style={{
                  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
                  fontSize: 20,
                  letterSpacing: '0.04em',
                  color: active ? '#FF4500' : '#F5F5F0',
                  marginBottom: 4,
                  transition: 'color 0.15s',
                }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786' }}>
                  {desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 1 — Tell us about yourself ──────────────────────────────────────────

const STEP1_COPY: Record<AccountType, { fieldLabel: string; placeholder: string; buttonText: string }> = {
  artist:  { fieldLabel: 'Artist Name', placeholder: 'Your artist name', buttonText: 'Set my artist name' },
  manager: { fieldLabel: 'Your Name',   placeholder: 'Your full name',   buttonText: 'Set my name' },
  label:   { fieldLabel: 'Label Name',  placeholder: 'Your label name',  buttonText: 'Set my label name' },
}

function Step1({ onNext, accountType, initialName = '' }: { onNext: (data: { artistName: string; genre: string }) => void; accountType: AccountType; initialName?: string }) {
  const [artistName, setArtistName] = useState(initialName);
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!artistName.trim() || !genre) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const profileUpdate: Record<string, unknown> = { artist_name: artistName.trim(), genre };
    if (accountType === 'label') profileUpdate.account_type = 'label';

    const { error: dbError } = await supabase
      .from('profiles').update(profileUpdate).eq('id', user.id);
    if (dbError) { setError(dbError.message); setLoading(false); return; }

    if (accountType === 'label') {
      const { data: label, error: labelError } = await supabase
        .from('labels')
        .insert({ name: artistName.trim(), owner_user_id: user.id })
        .select('id')
        .single();
      if (labelError) { setError(labelError.message); setLoading(false); return; }
      if (label) {
        await supabase.from('profiles').update({ label_id: label.id }).eq('id', user.id);
      }
    }

    onNext({ artistName: artistName.trim(), genre });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={heading}>Tell us about yourself.</h1>
      <div>
        <label style={monoLabel}>{STEP1_COPY[accountType].fieldLabel}</label>
        <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)}
          placeholder={STEP1_COPY[accountType].placeholder} style={fieldInput} autoFocus />
      </div>
      <div>
        <label style={monoLabel}>Primary Genre</label>
        <select value={genre} onChange={e => setGenre(e.target.value)}
          style={{ ...fieldInput, appearance: 'none', backgroundImage: 'none' }}>
          <option value="">Select a genre</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>{error}</p>}
      <button onClick={handleContinue} disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
        {loading ? 'Saving…' : STEP1_COPY[accountType].buttonText}
      </button>
    </div>
  );
}

// ── Step 2 — Connect Spotify ──────────────────────────────────────────────────

function Step2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function extractArtistId(input: string): string | null {
    const match = input.match(/spotify\.com\/artist\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  }

  async function handleContinue() {
    const artistId = extractArtistId(url.trim());
    if (!artistId) { setError('Please enter a valid Spotify artist URL.'); return; }
    setLoading(true); setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error: dbError } = await supabase
      .from('profiles').upsert({ id: user.id, artist_id: artistId }, { onConflict: 'id' });
    if (dbError) { setError(dbError.message); setLoading(false); return; }
    onNext();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={heading}>Connect your Spotify artist profile.</h1>
        <p style={subtext}>Enter your Spotify artist URL so we can pull in your catalog.</p>
      </div>
      <div>
        <label style={monoLabel}>Spotify Artist URL</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/artist/..." style={fieldInput} autoFocus />
      </div>
      {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>{error}</p>}
      <button onClick={handleContinue} disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
        {loading ? 'Saving…' : 'Connect Spotify'}
      </button>
      <button onClick={onSkip} style={skipLink}>Skip for now</button>
    </div>
  );
}

// ── Step 3 — Choose your plan ─────────────────────────────────────────────────

function PlanCard({ name, price, features, featured, buttonLabel, buttonStyle, onSelect, loading }: {
  name: string; price: string; features: string[]; featured?: boolean;
  buttonLabel: string; buttonStyle: React.CSSProperties; onSelect: () => void; loading: boolean;
}) {
  return (
    <div style={{
      flex: 1, border: featured ? '2px solid #FF4500' : '1px solid #2A2A2A',
      borderRadius: 12, padding: '24px 20px', background: '#111111',
      display: 'flex', flexDirection: 'column', gap: 16, position: 'relative',
    }}>
      {featured && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: '#FF4500', color: '#F5F5F0', fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap',
        }}>Most popular</div>
      )}
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 6 }}>{name}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 26, color: '#F5F5F0' }}>{price}</div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map(f => (
          <li key={f} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786', paddingLeft: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#FF4500' }}>·</span>{f}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} disabled={loading}
        style={{ ...buttonStyle, marginTop: 'auto', opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
        {loading ? 'Loading…' : buttonLabel}
      </button>
    </div>
  );
}

function Step3({ onFree, onPaid, accountType }: { onFree: () => void; onPaid: (priceId: string) => void; accountType: AccountType }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleFree() { setLoadingPlan('free'); try { await onFree(); } catch { setLoadingPlan(null); } }
  async function handlePaid(priceId: string, planKey: string) {
    setLoadingPlan(planKey); try { await onPaid(priceId); } catch { setLoadingPlan(null); }
  }

  if (accountType === 'label') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ ...heading, marginBottom: 0 }}>Your plan.</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PlanCard name="Label Plan" price="$499 / month"
            features={['Up to 50 artists across all managers', 'Everything in Manager', 'Label analytics', 'Manager performance tracking', 'Multi-manager roster', 'Priority support']}
            featured buttonLabel="Get Label" buttonStyle={btnPrimary}
            onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_LABEL_MONTHLY || '', 'label')}
            loading={loadingPlan === 'label'} />
        </div>
      </div>
    );
  }

  if (accountType === 'manager') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ ...heading, marginBottom: 0 }}>Choose your plan.</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PlanCard name="Manager Plan" price="$199 / month"
            features={['Up to 10 artists', 'Roster dashboard', 'Bulk pitch engine', 'Artist health scores', 'Release calendar', 'Roster intelligence brief']}
            featured buttonLabel="Get Manager" buttonStyle={btnPrimary}
            onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_MANAGER_MONTHLY || '', 'manager')}
            loading={loadingPlan === 'manager'} />
          <PlanCard name="Label Plan" price="$499 / month"
            features={['Up to 50 artists across all managers', 'Everything in Manager', 'Label analytics', 'Manager performance tracking', 'Multi-manager roster', 'Priority support']}
            buttonLabel="Get Label" buttonStyle={btnOutlined}
            onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_LABEL_MONTHLY || '', 'label')}
            loading={loadingPlan === 'label'} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ ...heading, marginBottom: 0 }}>Choose your plan.</h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <PlanCard name="Free" price="$0 / month"
          features={['Catalog overview', 'Recently played', '3 AI pitches/month', 'Monthly snapshot']}
          buttonLabel="Start free" buttonStyle={btnOutlined}
          onSelect={handleFree} loading={loadingPlan === 'free'} />
        <PlanCard name="Artist" price="$29 / month"
          features={['Everything in Free', 'Release runway planner', 'Unlimited AI pitches', 'Email sending', '500+ curator database', 'Full growth report', '2 distributions/month']}
          featured buttonLabel="Get Artist" buttonStyle={btnPrimary}
          onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_MONTHLY || '', 'artist')}
          loading={loadingPlan === 'artist'} />
        <PlanCard name="Pro" price="$149 / month"
          features={['Everything in Artist', 'Multi-platform sync', 'Royalty aggregator', 'Weekly AI briefs', 'Content repurposing', 'Sync licensing tools']}
          buttonLabel="Get Pro" buttonStyle={btnOutlined}
          onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '', 'pro')}
          loading={loadingPlan === 'pro'} />
      </div>
    </div>
  );
}

// ── Step 5 — All set ──────────────────────────────────────────────────────────

function Step5({ headline, subline, dest = '/dashboard' }: { headline: string; subline: string; dest?: string }) {
  const [loading, setLoading] = useState(false);
  function handleDone() { setLoading(true); window.location.href = dest; }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ ...heading, textAlign: 'center' }}>{headline}</h1>
        <p style={{ ...subtext, textAlign: 'center', marginBottom: 0 }}>{subline}</p>
      </div>
      <button onClick={handleDone} disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
        {loading ? 'Loading…' : 'Go to my dashboard'}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function OnboardingFlow() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>('artist');
  const [completedPlan, setCompletedPlan] = useState<'free' | 'artist' | 'pro' | null>(null);
  const [initialLabelName, setInitialLabelName] = useState('');

  // Honour ?step= from Stripe redirect; ?type= pre-selects account type and skips Step 0
  useEffect(() => {
    const s = Number(searchParams.get('step'));
    const t = searchParams.get('type') as AccountType | null;
    const l = searchParams.get('label') ?? '';
    if (t && ['artist', 'manager', 'label'].includes(t)) {
      setAccountType(t);
      if (t === 'label' && l) setInitialLabelName(l);
      if (!s || s < 1 || s > 6) setStep(2);
    }
    if (s >= 1 && s <= 6) setStep(s);
  }, [searchParams]);

  function next() { setStep(s => Math.min(s + 1, 6)); }

  function handleAccountType(type: AccountType) {
    setAccountType(type);
    setStep(2);
  }

  async function handleFree() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, tier: 'free', onboarding_complete: true, account_type: accountType,
    }, { onConflict: 'id' });
    if (error) throw error;
    setCompletedPlan('free');
    setStep(6);
  }

  async function handlePaid(priceId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, context: 'onboarding' }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  // Runs when step 6 mounts — handles free path and Stripe redirect return
  useEffect(() => {
    if (step === 6) {
      (async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles').select('artist_name, onboarding_complete, tier').eq('id', user.id).single();
        if (profile?.tier === 'artist' || profile?.tier === 'pro') setCompletedPlan(profile.tier);
        if (!profile?.onboarding_complete) {
          await supabase.from('profiles').update({
            onboarding_complete: true,
            ...(accountType && { account_type: accountType }),
          }).eq('id', user.id);
        }
        fetch('/api/email/onboarding-complete', { method: 'POST' }).catch(() => {});
      })();
    }
  }, [step, accountType]);

  const stepCounter = `${String(step).padStart(2, '0')} / 06`;

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px 40px',
    }}>
      <div style={{ ...cornerText, top: 24, left: 24 }}>Onboarding</div>
      <div style={{ ...cornerText, top: 24, right: 24 }}>{stepCounter}</div>
      <div style={{ ...cornerText, bottom: 24, left: 24 }}>ZOVO — 2026</div>
      <div style={{ ...cornerText, bottom: 24, right: 24 }}>
        {step === 2
          ? accountType === 'manager' ? 'YOUR PROFILE' : accountType === 'label' ? 'YOUR LABEL PROFILE' : 'YOUR ARTIST PROFILE'
          : BOTTOM_RIGHT_LABELS[step]}
      </div>

      <div style={{ width: '100%', maxWidth: step === 4 ? 800 : step === 1 ? 720 : 480 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
            ZOVO<span style={{ color: '#FF4500' }}>.</span>
          </span>
        </div>

        {step === 1 && <Step0 onSelect={handleAccountType} />}
        {step === 2 && <Step1 onNext={() => next()} accountType={accountType} initialName={initialLabelName} />}
        {step === 3 && <Step2 onNext={next} onSkip={next} />}
        {step === 4 && <Step3 onFree={handleFree} onPaid={handlePaid} accountType={accountType} />}
        {step === 6 && (
          <Step5
            dest={accountType === 'label' ? '/label' : '/dashboard'}
            headline={
              completedPlan === 'artist' ? "You're in. Your Artist account is active." :
              completedPlan === 'pro'    ? "You're in. Your Pro account is active." :
              "You're in."
            }
            subline={
              completedPlan === 'free'
                ? "Your free account is ready. Start by connecting your Spotify catalog or sending your first pitch."
                : "Your music career dashboard is ready."
            }
          />
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return <Suspense><OnboardingFlow /></Suspense>;
}
