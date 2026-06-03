'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Wordmark from '@/components/Wordmark'

const GENRES = ['Hip-Hop', 'R&B', 'Pop', 'Country', 'EDM', 'Latin', 'Indie', 'Electronic', 'Rock', 'Other']

const PLANS = [
  { name: 'Free', price: '$0', period: '', features: ['3 curator pitches/month', 'Basic dashboard', 'Spotify connection'], tier: 'free', priceKey: null },
  { name: 'Artist', price: '$29', period: '/mo', annually: '$278/yr', features: ['Unlimited pitches', 'AI pitch generation', 'Priority support', 'Full analytics'], tier: 'artist', priceKey: 'ARTIST_MONTHLY', recommended: true },
  { name: 'Pro', price: '$149', period: '/mo', annually: '$1,430/yr', features: ['Everything in Artist', 'Music distribution', 'Advanced AI tools', 'White-glove support'], tier: 'pro', priceKey: 'PRO_MONTHLY' },
]

const STEP_LABELS = ['Artist Info', 'Spotify Profile', 'Connect Account', 'Choose Plan', 'Done']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [artistName, setArtistName] = useState('')
  const [genre, setGenre] = useState('')
  const [spotifyArtistUrl, setSpotifyArtistUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  async function saveStep1() {
    if (!artistName.trim() || !genre) { setError('Please fill in all fields'); return }
    setLoading(true); setError(null)
    const { error } = await createClient().from('profiles').update({ artist_name: artistName.trim(), genre }).eq('id', userId!)
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep(2)
  }

  async function saveStep2() {
    setLoading(true)
    if (spotifyArtistUrl.trim()) {
      const match = spotifyArtistUrl.match(/artist\/([a-zA-Z0-9]+)/)
      if (match?.[1]) {
        await createClient().from('profiles').update({ artist_id: match[1] }).eq('id', userId!)
      }
    }
    setLoading(false)
    setStep(3)
  }

  async function handlePlanSelect(tier: string, priceKey: string | null) {
    if (!priceKey) {
      await createClient().from('profiles').update({ tier: 'free' }).eq('id', userId!)
      setStep(5)
      return
    }
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceKey }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  async function finishOnboarding() {
    setLoading(true)
    await createClient().from('profiles').update({ onboarding_complete: true }).eq('id', userId!)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-10"><Wordmark size="md" /></div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: i + 1 <= step ? '#111010' : '#E2DED8', color: i + 1 <= step ? '#FAF8F5' : '#8A8786', fontFamily: 'DM Mono, monospace' }}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="label mt-1 hidden sm:block" style={{ fontSize: '9px' }}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div className="h-px w-8 mb-4" style={{ backgroundColor: i + 1 < step ? '#111010' : '#E2DED8' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 1 && (
            <div>
              <p className="label mb-2">Step 1 of 5</p>
              <h2 className="text-2xl mb-1">Tell us about yourself</h2>
              <p className="mb-6" style={{ color: '#8A8786' }}>Help us personalize your Zovo experience.</p>
              {error && <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="label block mb-1.5">Artist Name</label>
                  <input className="input" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Your artist name" />
                </div>
                <div>
                  <label className="label block mb-1.5">Primary Genre</label>
                  <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Select a genre</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={saveStep1} disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Continue →'}</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="label mb-2">Step 2 of 5</p>
              <h2 className="text-2xl mb-1">Connect your Spotify artist profile</h2>
              <p className="mb-6" style={{ color: '#8A8786' }}>Paste your Spotify artist URL to sync your catalog.</p>
              <div>
                <label className="label block mb-1.5">Spotify Artist URL</label>
                <input className="input" value={spotifyArtistUrl} onChange={(e) => setSpotifyArtistUrl(e.target.value)} placeholder="https://open.spotify.com/artist/..." />
                <p className="mt-2 text-sm" style={{ color: '#8A8786' }}>Find this on your Spotify for Artists profile</p>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(3)} className="btn-ghost">Skip</button>
                <button onClick={saveStep2} disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Continue →'}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="label mb-2">Step 3 of 5</p>
              <h2 className="text-2xl mb-1">Connect your Spotify account</h2>
              <p className="mb-6" style={{ color: '#8A8786' }}>Allow Zovo to access your listening data and playback history.</p>
              <div className="p-4 rounded-md mb-6" style={{ backgroundColor: '#F2EFEA', border: '1px solid #E2DED8' }}>
                <p className="label mb-2">Permissions requested</p>
                <ul className="text-sm space-y-1" style={{ color: '#3d3c3c' }}>
                  <li>· Read your profile information</li>
                  <li>· View your top tracks and artists</li>
                  <li>· View your recently played tracks</li>
                  <li>· View your current playback state</li>
                </ul>
              </div>
              <a href="/api/spotify/login" className="btn-primary w-full" style={{ backgroundColor: '#1DB954', justifyContent: 'center', display: 'flex' }}>
                Connect Spotify
              </a>
              <div className="flex justify-start mt-4">
                <button onClick={() => setStep(4)} className="btn-ghost">Skip for now</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="label mb-2">Step 4 of 5</p>
              <h2 className="text-2xl mb-1">Choose your plan</h2>
              <p className="mb-6" style={{ color: '#8A8786' }}>Start free or unlock the full Zovo experience.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <div key={plan.name} className="p-4 rounded-lg relative" style={{ border: plan.recommended ? '2px solid #111010' : '1px solid #E2DED8', backgroundColor: '#FAF8F5' }}>
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.08em', backgroundColor: '#111010', color: '#FAF8F5', padding: '2px 8px', borderRadius: '20px' }}>RECOMMENDED</span>
                      </div>
                    )}
                    <p className="label">{plan.name}</p>
                    <div className="flex items-baseline gap-0.5 mt-1 mb-3">
                      <span className="text-2xl font-medium" style={{ fontFamily: 'Fraunces, serif' }}>{plan.price}</span>
                      <span style={{ color: '#8A8786', fontSize: '14px' }}>{plan.period}</span>
                    </div>
                    {'annually' in plan && <p className="text-xs mb-3" style={{ color: '#8A8786' }}>{plan.annually} billed annually</p>}
                    <ul className="text-sm space-y-1 mb-4" style={{ color: '#3d3c3c' }}>
                      {plan.features.map((f) => <li key={f}>· {f}</li>)}
                    </ul>
                    <button onClick={() => handlePlanSelect(plan.tier, plan.priceKey ?? null)} disabled={loading} className={plan.recommended ? 'btn-primary w-full' : 'btn-ghost w-full'} style={{ fontSize: '13px', padding: '0.5rem' }}>
                      {plan.name === 'Free' ? 'Start free' : `Choose ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8440A' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-3xl mb-2">You&apos;re all set, {artistName || 'artist'}.</h2>
              <p className="mb-8" style={{ color: '#8A8786' }}>Your music career dashboard is ready.</p>
              <button onClick={finishOnboarding} disabled={loading} className="btn-primary">
                {loading ? 'Loading...' : 'Go to dashboard →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
