'use client'

import { useState } from 'react'

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0A0A0A',
  border: '1px solid #2A2A2A',
  padding: '12px 14px',
  borderRadius: 6,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: '#F5F5F0',
  outline: 'none',
  boxSizing: 'border-box',
}

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function AddArtistModal({ onClose, onSuccess }: Props) {
  const [artistName, setArtistName] = useState('')
  const [genre, setGenre] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!artistName.trim()) { setError('Artist name is required.'); return }

    setLoading(true)
    const res = await fetch('/api/roster/create-artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: artistName.trim(),
        genre: genre.trim() || undefined,
        spotify_url: spotifyUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        email: email.trim() || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    onSuccess()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        backgroundColor: '#111111', border: '1px solid #1A1A1A',
        borderRadius: 10, padding: 32, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{
            fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
            fontWeight: 400, fontSize: 28, letterSpacing: '0.02em',
            color: '#F5F5F0', margin: 0,
          }}>
            ADD ARTIST
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8A8786', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Artist Name</label>
            <input
              type="text"
              value={artistName}
              onChange={e => setArtistName(e.target.value)}
              placeholder="Artist name"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Genre</label>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="e.g. Hip-Hop, Electronic, R&B"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Spotify Artist URL</label>
            <input
              type="text"
              value={spotifyUrl}
              onChange={e => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes about this artist..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span>Artist Email</span>
              <span style={{ fontSize: 9, color: '#5A5A58', letterSpacing: '0.08em' }}>(OPTIONAL)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="artist@email.com — they'll get an invite to claim this profile"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#FF4444', margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, backgroundColor: 'transparent', border: '1px solid #2A2A2A',
                borderRadius: 6, color: '#8A8786', fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '12px 0', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, backgroundColor: '#FF4500', border: 'none',
                borderRadius: 6, color: 'white', fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '12px 0', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'CREATING...' : email.trim() ? 'CREATE PROFILE + SEND INVITE' : 'CREATE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
