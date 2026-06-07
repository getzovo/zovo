'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LABEL_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
}

const INPUT_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: '#F5F5F0',
  backgroundColor: '#111111',
  border: '1px solid #1A1A1A',
  borderRadius: 6,
  padding: '9px 12px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const CARD_STYLE = {
  backgroundColor: '#111111',
  border: '1px solid #1A1A1A',
  borderRadius: 8,
  padding: 24,
  marginBottom: 16,
}

const SECTION_TITLE_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#8A8786',
  marginBottom: 16,
}

const DIVIDER_STYLE = {
  height: 1,
  backgroundColor: '#1A1A1A',
  margin: '20px 0',
}

function PrimaryButton({ children, onClick, disabled, loading }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: 14,
        color: '#F5F5F0',
        backgroundColor: '#FF4500',
        border: 'none',
        borderRadius: 8,
        padding: '9px 18px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  )
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: 14,
        color: '#F5F5F0',
        backgroundColor: 'transparent',
        border: '1px solid #1A1A1A',
        borderRadius: 8,
        padding: '9px 18px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  free:    { bg: '#1A1A1A',   color: '#8A8786' },
  artist:  { bg: '#FF450022', color: '#FF4500' },
  pro:     { bg: '#2A2A2A',   color: '#F5F5F0' },
  manager: { bg: '#FF450022', color: '#FF4500' },
  label:   { bg: '#FF450022', color: '#FF4500' },
}

const UPGRADE_PLANS = [
  {
    key: 'artist',
    label: 'Artist',
    desc: 'Release runway, unlimited pitches, distributions',
    monthlyEnv: 'NEXT_PUBLIC_STRIPE_PRICE_ARTIST_MONTHLY',
    annualEnv:  'NEXT_PUBLIC_STRIPE_PRICE_ARTIST_ANNUAL',
  },
  {
    key: 'pro',
    label: 'Pro',
    desc: 'Multi-platform sync, royalty tools, weekly briefs',
    monthlyEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
    annualEnv:  'NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL',
  },
  {
    key: 'manager',
    label: 'Manager',
    desc: 'Roster management, artist dashboards, pitching on behalf',
    monthlyEnv: 'NEXT_PUBLIC_STRIPE_PRICE_MANAGER_MONTHLY',
    annualEnv:  'NEXT_PUBLIC_STRIPE_PRICE_MANAGER_ANNUAL',
  },
  {
    key: 'label',
    label: 'Label',
    desc: 'Full label operations, multi-artist distribution',
    monthlyEnv: 'NEXT_PUBLIC_STRIPE_PRICE_LABEL_MONTHLY',
    annualEnv:  'NEXT_PUBLIC_STRIPE_PRICE_LABEL_ANNUAL',
  },
] as const

function TierBadge({ tier }: { tier: string }) {
  const t = tier.toLowerCase()
  const { bg, color } = TIER_COLORS[t] ?? TIER_COLORS.free
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      backgroundColor: bg,
      color,
      borderRadius: 4,
      padding: '3px 8px',
    }}>
      {tier}
    </span>
  )
}

interface Props {
  userId: string
  email: string
  artistName: string
  genre: string
  tier: string
  accountType: string
  artistMonthlyPriceId: string
  spotifyDisplayName: string | null
}

export default function SettingsForm({ userId, email, artistName, genre, tier, accountType, spotifyDisplayName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(artistName)
  const [genreVal, setGenreVal] = useState(genre)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [spotifyName, setSpotifyName] = useState(spotifyDisplayName)
  const [disconnecting, setDisconnecting] = useState(false)

  const isPaid = !['free', ''].includes(tier)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)

  async function handleUpgrade(priceId: string, planKey: string) {
    setUpgradingPlan(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setUpgradingPlan(null)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    setSaveStatus('idle')
    const update: Record<string, string> = { artist_name: name.trim() }
    if (accountType !== 'label') update.genre = genreVal.trim()
    const { error } = await supabase.from('profiles').update(update).eq('id', userId)
    setSaving(false)
    setSaveStatus(error ? 'error' : 'saved')
  }

  async function handleDisconnectSpotify() {
    setDisconnecting(true)
    await fetch('/api/spotify/disconnect', { method: 'POST' })
    setSpotifyName(null)
    setDisconnecting(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div>
      {/* Profile */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={LABEL_STYLE}>
              {accountType === 'manager' ? 'Manager Name' : accountType === 'label' ? 'Label Name' : 'Artist Name'}
            </label>
            <input
              style={INPUT_STYLE}
              value={name}
              onChange={e => { setName(e.target.value); setSaveStatus('idle') }}
              placeholder={accountType === 'manager' ? 'Your name' : accountType === 'label' ? 'Your label name' : 'Your artist name'}
            />
          </div>
          {accountType !== 'label' && (
            <div>
              <label style={LABEL_STYLE}>Genre</label>
              <input
                style={INPUT_STYLE}
                value={genreVal}
                onChange={e => { setGenreVal(e.target.value); setSaveStatus('idle') }}
                placeholder="e.g. Indie Pop, R&B, Hip-Hop"
              />
            </div>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PrimaryButton onClick={handleSaveProfile} loading={saving}>
            Save Changes
          </PrimaryButton>
          {saveStatus === 'saved' && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786' }}>
              Saved.
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#FF4500' }}>
              Something went wrong. Try again.
            </span>
          )}
        </div>
      </div>

      {/* Spotify */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Spotify</div>
        {spotifyName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0' }}>
                {spotifyName}
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backgroundColor: '#1DB95422',
                color: '#1DB954',
                borderRadius: 4,
                padding: '3px 8px',
              }}>
                Connected
              </span>
            </div>
            <button
              onClick={handleDisconnectSpotify}
              disabled={disconnecting}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: '#F5F5F0',
                backgroundColor: 'transparent',
                border: '1px solid #1A1A1A',
                borderRadius: 8,
                padding: '9px 18px',
                cursor: disconnecting ? 'not-allowed' : 'pointer',
                opacity: disconnecting ? 0.6 : 1,
              }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786' }}>
              No Spotify account connected.
            </span>
            <a
              href="/api/spotify/connect"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: '#fff',
                backgroundColor: '#1DB954',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Connect Spotify
            </a>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Subscription</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: isPaid ? 0 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0' }}>
              Current plan
            </span>
            <TierBadge tier={tier.charAt(0).toUpperCase() + tier.slice(1)} />
          </div>
          {isPaid && <GhostButton>Manage Subscription</GhostButton>}
        </div>

        {!isPaid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {UPGRADE_PLANS.map(plan => {
              const monthlyId = process.env[plan.monthlyEnv] ?? ''
              const annualId  = process.env[plan.annualEnv]  ?? ''
              const isLoading = upgradingPlan === plan.key + '-m' || upgradingPlan === plan.key + '-a'
              return (
                <div key={plan.key} style={{
                  border: '1px solid #1A1A1A',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5F5F0', marginBottom: 2 }}>
                      {plan.label}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#8A8786' }}>
                      {plan.desc}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleUpgrade(monthlyId, plan.key + '-m')}
                      disabled={!!upgradingPlan || !monthlyId}
                      style={{
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12,
                        color: '#F5F5F0', backgroundColor: '#FF4500', border: 'none',
                        borderRadius: 6, padding: '7px 12px',
                        cursor: upgradingPlan || !monthlyId ? 'not-allowed' : 'pointer',
                        opacity: upgradingPlan === plan.key + '-m' ? 0.6 : 1,
                      }}
                    >
                      {isLoading && upgradingPlan === plan.key + '-m' ? '…' : 'Monthly'}
                    </button>
                    <button
                      onClick={() => handleUpgrade(annualId, plan.key + '-a')}
                      disabled={!!upgradingPlan || !annualId}
                      style={{
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12,
                        color: '#F5F5F0', backgroundColor: 'transparent',
                        border: '1px solid #2A2A2A', borderRadius: 6, padding: '7px 12px',
                        cursor: upgradingPlan || !annualId ? 'not-allowed' : 'pointer',
                        opacity: upgradingPlan === plan.key + '-a' ? 0.6 : 1,
                      }}
                    >
                      {isLoading && upgradingPlan === plan.key + '-a' ? '…' : 'Annual'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Account */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Account</div>
        <div>
          <label style={LABEL_STYLE}>Email</label>
          <input
            style={{ ...INPUT_STYLE, color: '#8A8786', backgroundColor: '#0A0A0A' }}
            value={email}
            readOnly
          />
        </div>
        <div style={DIVIDER_STYLE} />
        <GhostButton onClick={handleSignOut}>Sign Out</GhostButton>
      </div>
    </div>
  )
}
