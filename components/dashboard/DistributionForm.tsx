'use client'

import { useState } from 'react'

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--warm-white)',
  padding: '11px 14px',
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {optional && (
          <span style={{ marginLeft: 6, fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-muted)', opacity: 0.6 }}>
            optional
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export default function DistributionForm({ artistName }: { artistName: string }) {
  const [form, setForm] = useState({
    release_title: '',
    artist_name: artistName,
    release_type: 'Single',
    genre: '',
    release_date: '',
    upc: '',
    isrc: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/distribution/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseTitle: form.release_title,
          artistName: form.artist_name,
          releaseType: form.release_type,
          genre: form.genre,
          releaseDate: form.release_date,
          upc: form.upc,
          isrc: form.isrc,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'tier_locked') {
        setError('Distribution is available on Artist and Pro plans. Upgrade in Settings.')
        return
      }
      if (res.status === 403 && data.error === 'limit_reached') {
        setError("You've reached your 2 distribution submissions this month. Upgrade to Pro for unlimited.")
        return
      }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{
        backgroundColor: 'var(--off-white)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '24px',
        maxWidth: 560,
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Your release has been submitted. We&apos;ll be in touch within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--off-white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '24px',
      maxWidth: 560,
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Release Title">
            <input
              type="text"
              required
              value={form.release_title}
              onChange={set('release_title')}
              placeholder="e.g. Neon Lights"
              style={inputStyle}
            />
          </Field>
          <Field label="Artist Name">
            <input
              type="text"
              required
              value={form.artist_name}
              onChange={set('artist_name')}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Release Type">
            <select
              value={form.release_type}
              onChange={set('release_type')}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="Single">Single</option>
              <option value="EP">EP</option>
              <option value="Album">Album</option>
            </select>
          </Field>
          <Field label="Genre">
            <input
              type="text"
              required
              value={form.genre}
              onChange={set('genre')}
              placeholder="e.g. Indie Pop"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Release Date">
          <input
            type="date"
            required
            value={form.release_date}
            onChange={set('release_date')}
            style={{ ...inputStyle, colorScheme: 'light' }}
          />
        </Field>

        <div style={{ height: 1, backgroundColor: 'var(--border)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="UPC" optional>
            <input
              type="text"
              value={form.upc}
              onChange={set('upc')}
              placeholder="012345678901"
              style={inputStyle}
            />
          </Field>
          <Field label="ISRC" optional>
            <input
              type="text"
              value={form.isrc}
              onChange={set('isrc')}
              placeholder="US-S1Z-99-00001"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Notes" optional>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={4}
            placeholder="Anything else we should know about this release…"
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />
        </Field>

        {error && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--accent)',
            margin: 0,
          }}>
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: '#fff',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              padding: '11px 24px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Release'}
          </button>
        </div>
      </form>
    </div>
  )
}
