'use client'

import { useEffect, useRef, useState } from 'react'
import { type Curator } from './CuratorCard'

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
  const [releases, setReleases] = useState<Release[]>([])
  const [loadingReleases, setLoadingReleases] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [pitch, setPitch] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState(false)
  const [copied, setCopied] = useState(false)
  const pitchRef = useRef<HTMLDivElement>(null)

  const selectedRelease = selectedIndex !== '' ? releases[Number(selectedIndex)] ?? null : null

  useEffect(() => {
    fetch('/api/spotify/artist-stats')
      .then((r) => r.json())
      .then((data) => {
        setReleases(data.full_catalog ?? [])
        setLoadingReleases(false)
      })
      .catch(() => {
        setFetchError(true)
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
    if (!selectedRelease) return
    setGenerating(true)
    setGenerateError(false)
    setPitch(null)

    try {
      const res = await fetch('/api/pitches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curatorName: curator.name,
          playlistName: curator.playlist_name,
          curatorNotes: curator.notes ?? '',
          genreTags: curator.genre_tags ?? [],
          artistName: '', // populated server-side from profile in a future iteration
          releaseName: selectedRelease.name,
          releaseType: selectedRelease.type,
          releaseDate: selectedRelease.year,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.pitch) throw new Error(data.error ?? 'Generation failed')
      setPitch(data.pitch)
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
          backgroundColor: 'var(--warm-white)',
          border: '1px solid var(--border)',
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
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
            fontSize: 20,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
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
              color: 'var(--ink-muted)',
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
          backgroundColor: 'var(--off-white)',
          border: '1px solid var(--border)',
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
            color: 'var(--ink-muted)',
          }}>
            Curator
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: 'var(--ink)',
          }}>
            {curator.name}
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--ink-muted)',
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
            color: 'var(--ink-muted)',
          }}>
            Release
          </label>
          {fetchError ? (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'var(--ink-muted)',
              margin: 0,
            }}>
              Could not load releases. Check your Spotify connection in Settings.
            </p>
          ) : (
            <select
              value={selectedIndex}
              disabled={loadingReleases}
              onChange={(e) => { setSelectedIndex(e.target.value); setPitch(null) }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: selectedIndex === '' ? 'var(--ink-muted)' : 'var(--ink)',
                backgroundColor: 'var(--warm-white)',
                border: '1px solid var(--border)',
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
        </div>

        {/* Generate button */}
        <button
          disabled={!selectedRelease || generating}
          onClick={handleGenerate}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: '#fff',
            backgroundColor: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            padding: '11px 0',
            cursor: selectedRelease && !generating ? 'pointer' : 'not-allowed',
            opacity: selectedRelease && !generating ? 1 : 0.4,
            width: '100%',
            transition: 'opacity 0.15s',
          }}
        >
          {generating ? 'Generating…' : 'Generate Pitch'}
        </button>

        {/* Generated pitch */}
        {generateError && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--accent)',
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
                color: 'var(--ink-muted)',
              }}>
                Your Pitch
              </span>
              <button
                onClick={handleCopy}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: copied ? 'var(--ink-muted)' : 'var(--ink)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{
              backgroundColor: 'var(--off-white)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '14px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'var(--ink)',
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
