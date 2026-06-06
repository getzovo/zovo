'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Curator } from './CuratorCard'
import UpgradeModal from '@/components/ui/UpgradeModal'

interface Release {
  name: string
  type: string
  year: string
  cover_art_url: string | null
}

interface Props {
  curator: Curator
  onClose: () => void
}

export default function PitchModal({ curator, onClose }: Props) {
  const router = useRouter()
  const [releases, setReleases] = useState<Release[]>([])
  const [loadingReleases, setLoadingReleases] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<string>('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [generating, setGenerating] = useState(false)
  const [pitch, setPitch] = useState<string | null>(null)
  const [pitchId, setPitchId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState(false)
  const [pitchLimitReached, setPitchLimitReached] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const pitchRef = useRef<HTMLDivElement>(null)

  const selectedRelease = selectedIndex !== '' ? releases[Number(selectedIndex)] ?? null : null
  const showManual = !loadingReleases && releases.length === 0
  const canGenerate = !generating && (
    selectedRelease !== null ||
    (manualTitle.trim().length > 0 && manualArtist.trim().length > 0)
  )

  useEffect(() => {
    fetch('/api/spotify/artist-stats')
      .then(async (r) => {
        const data = await r.json()
        if (r.status === 429 || data.error === 'rate_limited') {
          setFetchError('Spotify is rate limited — wait a moment and try again.')
        } else if (!r.ok) {
          setFetchError('Connect your Spotify artist profile in Settings to load your releases.')
        } else if (!data.full_catalog?.length) {
          setFetchError('No releases found on this Spotify account.')
        } else {
          setReleases(data.full_catalog)
        }
        setLoadingReleases(false)
      })
      .catch(() => {
        setFetchError('Connect your Spotify account in Settings to load your releases.')
        setLoadingReleases(false)
      })
  }, [])

  useEffect(() => {
    if (pitch && pitchRef.current) {
      pitchRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [pitch])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)
    setGenerateError(false)
    setPitch(null)
    setPitchId(null)
    setSent(false)

    const releasePayload = selectedRelease
      ? { releaseName: selectedRelease.name, releaseType: selectedRelease.type, releaseDate: selectedRelease.year }
      : { releaseName: manualTitle.trim(), releaseType: 'release', artistNameOverride: manualArtist.trim() }

    try {
      const res = await fetch('/api/pitches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorId: curator.id,
          curatorName: curator.name,
          playlistName: curator.playlist_name,
          curatorNotes: curator.notes ?? '',
          genreTags: curator.genre_tags ?? [],
          ...releasePayload,
        }),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'pitch_limit_reached') {
        setPitchLimitReached(true)
        return
      }
      if (!res.ok || !data.pitch) throw new Error(data.error ?? 'Generation failed')
      setPitch(data.pitch)
      setPitchId(data.pitchId ?? null)
    } catch {
      setGenerateError(true)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    if (!pitch) return
    await navigator.clipboard.writeText(pitch)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSend() {
    if (!pitch || sending || sent) return
    setSending(true)
    try {
      const res = await fetch('/api/pitches/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchId, curatorId: curator.id }),
      })
      if (res.ok) {
        setSent(true)
        router.refresh()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 16, 16, 0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#111111',
          border: '1px solid #1A1A1A',
          borderRadius: 10,
          padding: 28,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: '0.02em',
            color: '#F5F5F0',
          }}>
            Generate a Pitch
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8A8786',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Curator summary */}
        <div style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#8A8786',
          }}>
            Curator
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: '#F5F5F0',
          }}>
            {curator.name}
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#8A8786',
          }}>
            {curator.playlist_name}
          </span>
        </div>

        {/* Release selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#8A8786',
          }}>
            Release
          </label>
          {fetchError ? (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#8A8786',
              margin: 0,
            }}>
              {fetchError}
            </p>
          ) : (
            <select
              value={selectedIndex}
              disabled={loadingReleases}
              onChange={(e) => { setSelectedIndex(e.target.value); setPitch(null) }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: selectedIndex === '' ? '#8A8786' : '#F5F5F0',
                backgroundColor: '#111111',
                border: '1px solid #1A1A1A',
                borderRadius: 8,
                padding: '10px 14px',
                appearance: 'none',
                cursor: loadingReleases ? 'wait' : 'pointer',
                opacity: loadingReleases ? 0.6 : 1,
              }}
            >
              <option value="" disabled>
                {loadingReleases ? 'Loading releases…' : 'Select a release'}
              </option>
              {releases.map((r, i) => (
                <option key={i} value={String(i)}>
                  {r.name} ({r.year})
                </option>
              ))}
            </select>
          )}

          {showManual && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#8A8786',
              }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#1A1A1A' }} />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  Or enter manually
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#1A1A1A' }} />
              </div>
              <div>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#8A8786',
                  display: 'block',
                  marginBottom: 5,
                }}>
                  Release Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={e => { setManualTitle(e.target.value); setPitch(null) }}
                  placeholder="e.g. Midnight Drive"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#F5F5F0',
                    backgroundColor: '#111111',
                    border: '1px solid #1A1A1A',
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: '100%',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#8A8786',
                  display: 'block',
                  marginBottom: 5,
                }}>
                  Artist Name
                </label>
                <input
                  type="text"
                  value={manualArtist}
                  onChange={e => { setManualArtist(e.target.value); setPitch(null) }}
                  placeholder="Your artist name"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#F5F5F0',
                    backgroundColor: '#111111',
                    border: '1px solid #1A1A1A',
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: '100%',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          disabled={!canGenerate}
          onClick={handleGenerate}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: '#F5F5F0',
            backgroundColor: '#FF4500',
            border: 'none',
            borderRadius: 8,
            padding: '11px 0',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            opacity: canGenerate ? 1 : 0.4,
            width: '100%',
            transition: 'opacity 0.15s',
          }}
        >
          {generating ? 'Generating…' : 'Generate Pitch'}
        </button>

        <UpgradeModal
          isOpen={pitchLimitReached}
          onClose={() => setPitchLimitReached(false)}
          featureName="Unlimited Pitches"
        />

        {/* Generate error */}
        {generateError && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#FF4500',
            margin: 0,
          }}>
            Something went wrong. Please try again.
          </p>
        )}

        {pitch && (
          <div ref={pitchRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#8A8786',
              }}>
                Your Pitch
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: copied ? '#8A8786' : '#F5F5F0',
                    backgroundColor: 'transparent',
                    border: '1px solid #1A1A1A',
                    borderRadius: 4,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || sent}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: sent ? '#8A8786' : '#F5F5F0',
                    backgroundColor: 'transparent',
                    border: '1px solid #1A1A1A',
                    borderRadius: 4,
                    padding: '4px 10px',
                    cursor: sending || sent ? 'default' : 'pointer',
                    opacity: sending ? 0.5 : 1,
                    transition: 'color 0.15s, opacity 0.15s',
                  }}
                >
                  {sent ? 'Sent ✓' : sending ? 'Sending…' : 'Send Pitch'}
                </button>
              </div>
            </div>
            <div style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #1A1A1A',
              borderRadius: 8,
              padding: '14px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#F5F5F0',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {pitch}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
