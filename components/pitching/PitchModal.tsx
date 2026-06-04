'use client'

import { useEffect, useState } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string>('')

  const selectedRelease = selectedIndex !== '' ? releases[Number(selectedIndex)] ?? null : null

  useEffect(() => {
    fetch('/api/spotify/artist-stats')
      .then((r) => r.json())
      .then((data) => {
        setReleases(data.full_catalog ?? [])
        setLoading(false)
      })
      .catch(() => {
        setFetchError(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
              disabled={loading}
              onChange={(e) => setSelectedIndex(e.target.value)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: selectedIndex === '' ? 'var(--ink-muted)' : 'var(--ink)',
                backgroundColor: 'var(--warm-white)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                appearance: 'none',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <option value="" disabled>
                {loading ? 'Loading releases…' : 'Select a release'}
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
          disabled={!selectedRelease}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: '#fff',
            backgroundColor: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            padding: '11px 0',
            cursor: selectedRelease ? 'pointer' : 'not-allowed',
            opacity: selectedRelease ? 1 : 0.4,
            width: '100%',
            transition: 'opacity 0.15s',
          }}
        >
          Generate Pitch
        </button>
      </div>
    </div>
  )
}
