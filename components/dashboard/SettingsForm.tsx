'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LABEL_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-muted)',
  display: 'block',
  marginBottom: 6,
}

const INPUT_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: 'var(--ink)',
  backgroundColor: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '9px 12px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const CARD_STYLE = {
  backgroundColor: 'var(--off-white)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 24,
  marginBottom: 16,
}

const SECTION_TITLE_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-muted)',
  marginBottom: 16,
}

const DIVIDER_STYLE = {
  height: 1,
  backgroundColor: 'var(--border)',
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
        color: '#fff',
        backgroundColor: '#E8440A',
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
        color: 'var(--ink)',
        backgroundColor: 'transparent',
        border: '1px solid var(--border)',
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
  free:   { bg: 'var(--border)',  color: 'var(--ink-muted)' },
  artist: { bg: '#E8440A22',     color: '#E8440A' },
  pro:    { bg: '#1a1a1a',       color: '#fff' },
}

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
}

export default function SettingsForm({ userId, email, artistName, genre, tier }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(artistName)
  const [genreVal, setGenreVal] = useState(genre)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const isPaid = tier === 'artist' || tier === 'pro'

  async function handleSaveProfile() {
    setSaving(true)
    setSaveStatus('idle')
    const { error } = await supabase
      .from('profiles')
      .update({ artist_name: name.trim(), genre: genreVal.trim() })
      .eq('id', userId)
    setSaving(false)
    setSaveStatus(error ? 'error' : 'saved')
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
            <label style={LABEL_STYLE}>Artist Name</label>
            <input
              style={INPUT_STYLE}
              value={name}
              onChange={e => { setName(e.target.value); setSaveStatus('idle') }}
              placeholder="Your artist name"
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Genre</label>
            <input
              style={INPUT_STYLE}
              value={genreVal}
              onChange={e => { setGenreVal(e.target.value); setSaveStatus('idle') }}
              placeholder="e.g. Indie Pop, R&B, Hip-Hop"
            />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PrimaryButton onClick={handleSaveProfile} loading={saving}>
            Save Changes
          </PrimaryButton>
          {saveStatus === 'saved' && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink-muted)' }}>
              Saved.
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#E8440A' }}>
              Something went wrong. Try again.
            </span>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Subscription</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--ink)' }}>
              Current plan
            </span>
            <TierBadge tier={tier.charAt(0).toUpperCase() + tier.slice(1)} />
          </div>
          {isPaid ? (
            <a
              href="/api/stripe/checkout"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '9px 18px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Manage Subscription
            </a>
          ) : (
            <a
              href="/api/stripe/checkout"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: '#fff',
                backgroundColor: '#E8440A',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Account */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Account</div>
        <div>
          <label style={LABEL_STYLE}>Email</label>
          <input
            style={{ ...INPUT_STYLE, color: 'var(--ink-muted)', backgroundColor: 'var(--off-white)' }}
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
