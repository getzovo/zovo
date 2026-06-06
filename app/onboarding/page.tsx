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
  1: 'YOUR ARTIST PROFILE',
  2: 'SPOTIFY CONNECT',
  3: 'CHOOSE YOUR PLAN',
  4: 'DISTRIBUTION SETUP',
  5: "YOU'RE IN.",
};

// ── Step 1 — Tell us about yourself ──────────────────────────────────────────

function Step1({
  onNext,
}: {
  onNext: (data: { artistName: string; genre: string }) => void;
}) {
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!artistName.trim() || !genre) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ artist_name: artistName.trim(), genre })
      .eq('id', user.id);
    if (dbError) { setError(dbError.message); setLoading(false); return; }
    onNext({ artistName: artistName.trim(), genre });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={heading}>Tell us about yourself.</h1>
      </div>
      <div>
        <label style={monoLabel}>Artist Name</label>
        <input
          type="text"
          value={artistName}
          onChange={e => setArtistName(e.target.value)}
          placeholder="Your artist name"
          style={fieldInput}
          autoFocus
        />
      </div>
      <div>
        <label style={monoLabel}>Primary Genre</label>
        <select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          style={{ ...fieldInput, appearance: 'none', backgroundImage: 'none' }}
        >
          <option value="">Select a genre</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>
          {error}
        </p>
      )}
      <button
        onClick={handleContinue}
        disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? 'Saving…' : 'Set my artist name'}
      </button>
    </div>
  );
}

// ── Step 2 — Connect Spotify artist profile ───────────────────────────────────

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
    if (!artistId) {
      setError('Please enter a valid Spotify artist URL.');
      return;
    }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, artist_id: artistId }, { onConflict: 'id' });
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
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/artist/..."
          style={fieldInput}
          autoFocus
        />
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>
          {error}
        </p>
      )}
      <button
        onClick={handleContinue}
        disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? 'Saving…' : 'Connect Spotify'}
      </button>
      <button onClick={onSkip} style={skipLink}>Skip for now</button>
    </div>
  );
}

// ── Step 3 — Choose your plan ─────────────────────────────────────────────────

function PlanCard({
  name,
  price,
  features,
  featured,
  buttonLabel,
  buttonStyle,
  onSelect,
  loading,
}: {
  name: string;
  price: string;
  features: string[];
  featured?: boolean;
  buttonLabel: string;
  buttonStyle: React.CSSProperties;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        border: featured ? '2px solid #FF4500' : '1px solid #2A2A2A',
        borderRadius: 12,
        padding: '24px 20px',
        background: '#111111',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
      }}
    >
      {featured && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FF4500',
          color: '#F5F5F0',
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}>
          Most popular
        </div>
      )}
      <div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#8A8786',
          marginBottom: 6,
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: 26,
          color: '#F5F5F0',
        }}>
          {price}
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map(f => (
          <li key={f} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#8A8786',
            paddingLeft: 16,
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0, color: '#FF4500' }}>·</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={loading}
        style={{ ...buttonStyle, marginTop: 'auto', opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? 'Loading…' : buttonLabel}
      </button>
    </div>
  );
}

function Step3({ onFree, onPaid }: { onFree: () => void; onPaid: (priceId: string) => void }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleFree() {
    setLoadingPlan('free');
    try {
      await onFree();
    } catch {
      setLoadingPlan(null);
    }
  }

  async function handlePaid(priceId: string, planKey: string) {
    setLoadingPlan(planKey);
    try {
      await onPaid(priceId);
    } catch {
      setLoadingPlan(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ ...heading, marginBottom: 0 }}>Choose your plan.</h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <PlanCard
          name="Free"
          price="$0 / month"
          features={['Catalog overview', 'Recently played', '3 AI pitches/month', 'Monthly snapshot']}
          buttonLabel="Start free"
          buttonStyle={btnOutlined}
          onSelect={handleFree}
          loading={loadingPlan === 'free'}
        />
        <PlanCard
          name="Artist"
          price="$29 / month"
          features={[
            'Everything in Free',
            'Release runway planner',
            'Unlimited AI pitches',
            'Email sending',
            '500+ curator database',
            'Full growth report',
            '2 distributions/month',
          ]}
          featured
          buttonLabel="Get Artist"
          buttonStyle={btnPrimary}
          onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_MONTHLY || '', 'artist')}
          loading={loadingPlan === 'artist'}
        />
        <PlanCard
          name="Pro"
          price="$149 / month"
          features={[
            'Everything in Artist',
            'Multi-platform sync',
            'Royalty aggregator',
            'Weekly AI briefs',
            'Content repurposing',
            'Sync licensing tools',
          ]}
          buttonLabel="Get Pro"
          buttonStyle={btnOutlined}
          onSelect={() => handlePaid(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '', 'pro')}
          loading={loadingPlan === 'pro'}
        />
      </div>
    </div>
  );
}

// ── Step 4 — All set ──────────────────────────────────────────────────────────

function Step4({ headline, subline }: { headline: string; subline: string }) {
  const [loading, setLoading] = useState(false);

  function handleDone() {
    setLoading(true);
    window.location.href = '/dashboard';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ ...heading, textAlign: 'center' }}>{headline}</h1>
        <p style={{ ...subtext, textAlign: 'center', marginBottom: 0 }}>{subline}</p>
      </div>
      <button
        onClick={handleDone}
        disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? 'Loading…' : 'Go to my dashboard'}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function OnboardingFlow() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [completedPlan, setCompletedPlan] = useState<'free' | 'artist' | 'pro' | null>(null);

  // Honour ?step= from Stripe redirect
  useEffect(() => {
    const s = Number(searchParams.get('step'));
    if (s >= 1 && s <= 5) setStep(s);
  }, [searchParams]);

  function next() {
    setStep(s => Math.min(s + 1, 5));
  }

  async function handleFree() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, tier: 'free', onboarding_complete: true }, { onConflict: 'id' });
    if (error) throw error;
    setCompletedPlan('free');
    setStep(5);
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

  // Runs when step 5 mounts — handles both free (already set) and Stripe redirect path
  useEffect(() => {
    if (step === 5) {
      (async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('artist_name, onboarding_complete, tier')
          .eq('id', user.id)
          .single();
        if (profile?.tier === 'artist' || profile?.tier === 'pro') {
          setCompletedPlan(profile.tier);
        }
        if (!profile?.onboarding_complete) {
          await supabase
            .from('profiles')
            .update({ onboarding_complete: true })
            .eq('id', user.id);
        }
        // Seed Spotify cache so the dashboard has data on first load
        fetch('/api/email/onboarding-complete', { method: 'POST' }).catch(() => {})
      })();
    }
  }, [step]);

  const stepCounter = `${String(step).padStart(2, '0')} / 05`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px 40px',
    }}>
      {/* Corner labels */}
      <div style={{ ...cornerText, top: 24, left: 24 }}>Onboarding</div>
      <div style={{ ...cornerText, top: 24, right: 24 }}>{stepCounter}</div>
      <div style={{ ...cornerText, bottom: 24, left: 24 }}>ZOVO — 2026</div>
      <div style={{ ...cornerText, bottom: 24, right: 24 }}>{BOTTOM_RIGHT_LABELS[step]}</div>

      <div style={{ width: '100%', maxWidth: step === 3 ? 800 : 480 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <span style={{
            fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
            fontSize: 32,
            color: '#F5F5F0',
            letterSpacing: '0.05em',
          }}>
            ZOVO<span style={{ color: '#FF4500' }}>.</span>
          </span>
        </div>

        {step === 1 && (
          <Step1 onNext={() => next()} />
        )}
        {step === 2 && <Step2 onNext={next} onSkip={next} />}
        {step === 3 && <Step3 onFree={handleFree} onPaid={handlePaid} />}
        {step === 5 && (
          <Step4
            headline={
              completedPlan === 'artist' ? "You're in. Your Artist account is active." :
              completedPlan === 'pro' ? "You're in. Your Pro account is active." :
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
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
