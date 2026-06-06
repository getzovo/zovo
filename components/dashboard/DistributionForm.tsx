'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import UpgradeModal from '@/components/ui/UpgradeModal'

const RELEASE_TYPES = ['Single', 'EP', 'Album'] as const

const monoSm: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
}

const inputBase: React.CSSProperties = {
  width: '100%',
  border: '1px solid #1A1A1A',
  backgroundColor: '#111111',
  padding: '11px 14px',
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: '#F5F5F0',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={monoSm}>
        {label}
        {optional && (
          <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.5 }}>optional</span>
        )}
      </label>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: '#8A8786',
      paddingBottom: 12,
      borderBottom: '1px solid #1A1A1A',
      marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

function ProgressIndicator() {
  const steps = [
    { n: 1, label: 'Submit',      active: true },
    { n: 2, label: 'Review',      active: false },
    { n: 3, label: 'Live on DSPs', active: false },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 24, gap: 0 }}>
      {steps.map((step, i) => (
        <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: step.active ? '#FF4500' : 'transparent',
              border: step.active ? 'none' : '1px solid #2A2A2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: step.active ? '#F5F5F0' : '#8A8786',
            }}>
              {step.n}
            </div>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: step.active ? '#FF4500' : '#8A8786',
              whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, backgroundColor: '#1A1A1A', marginTop: 11, marginLeft: 8, marginRight: 8 }} />
          )}
        </div>
      ))}
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isFree, isLoading: tierLoading } = useSubscription()

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tierLoading && isFree) {
      setUpgradeModalOpen(true)
      return
    }
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
        setUpgradeModalOpen(true)
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

  function handleArtworkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArtworkUrl(URL.createObjectURL(file))
  }

  if (success) {
    return (
      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: 32,
        maxWidth: 480,
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F5F5F0', margin: 0, lineHeight: 1.6 }}>
          Your release has been submitted. We&apos;ll be in touch within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dist-field::placeholder { color: #8A8786; opacity: 0.7; }
        .dist-field:focus { border-color: #FF4500 !important; }
        .artwork-wrap:hover .artwork-img { filter: brightness(0.75); }
        .artwork-pill { opacity: 0; transition: opacity 0.15s; pointer-events: none; }
        .artwork-wrap:hover .artwork-pill { opacity: 1; }
        @media (max-width: 800px) {
          .dist-cols { flex-direction: column !important; }
          .dist-sticky { position: static !important; }
        }
      `}</style>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="Distribution Submissions"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleArtworkChange}
      />

      <div className="dist-cols" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Left: Form ─────────────────────────────────── */}
        <div style={{ flex: '0 0 60%', minWidth: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* RELEASE INFO */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <SectionLabel>Release Info</SectionLabel>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Release Title">
                  <input
                    type="text" required value={form.release_title}
                    onChange={set('release_title')}
                    placeholder="e.g. Neon Lights"
                    className="dist-field" style={inputBase}
                  />
                </Field>
                <Field label="Artist Name">
                  <input
                    type="text" required value={form.artist_name}
                    onChange={set('artist_name')}
                    className="dist-field" style={inputBase}
                  />
                </Field>
              </div>

              <Field label="Genre">
                <input
                  type="text" required value={form.genre}
                  onChange={set('genre')}
                  placeholder="e.g. Indie Pop"
                  className="dist-field" style={inputBase}
                />
              </Field>

              <Field label="Release Type">
                <div style={{ display: 'flex', gap: 8 }}>
                  {RELEASE_TYPES.map(type => {
                    const active = form.release_type === type
                    return (
                      <motion.button
                        key={type}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, release_type: type }))}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 8,
                          border: active ? 'none' : '1px solid #2A2A2A',
                          backgroundColor: active ? '#FF4500' : 'transparent',
                          color: active ? '#F5F5F0' : '#8A8786',
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s, color 0.15s',
                        }}
                      >
                        {type}
                      </motion.button>
                    )
                  })}
                </div>
              </Field>
            </motion.div>

            {/* RELEASE DETAILS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <SectionLabel>Release Details</SectionLabel>

              <Field label="Release Date">
                <input
                  type="date" required value={form.release_date}
                  onChange={set('release_date')}
                  className="dist-field"
                  style={{ ...inputBase, colorScheme: 'dark' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="UPC" optional>
                  <input
                    type="text" value={form.upc}
                    onChange={set('upc')}
                    placeholder="012345678901"
                    className="dist-field" style={inputBase}
                  />
                </Field>
                <Field label="ISRC" optional>
                  <input
                    type="text" value={form.isrc}
                    onChange={set('isrc')}
                    placeholder="US-S1Z-99-00001"
                    className="dist-field" style={inputBase}
                  />
                </Field>
              </div>

              <Field label="Notes" optional>
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  rows={4}
                  placeholder="Anything else we should know about this release…"
                  className="dist-field"
                  style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
                />
              </Field>
            </motion.div>

            {/* Submit + Progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
            >
              {error && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#FF4500', margin: '0 0 12px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
                  fontWeight: 400,
                  fontSize: 18,
                  letterSpacing: '0.08em',
                  color: '#F5F5F0',
                  backgroundColor: '#FF4500',
                  border: 'none',
                  borderRadius: 8,
                  padding: '14px 24px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Release'}
              </button>

              <ProgressIndicator />
            </motion.div>

          </form>
        </div>

        {/* ── Right: Preview Card ────────────────────────── */}
        <motion.div
          className="dist-sticky"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          style={{
            flex: '0 0 40%',
            position: 'sticky',
            top: 24,
            backgroundColor: '#111111',
            border: '1px solid #1A1A1A',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Artwork upload */}
          <div
            className="artwork-wrap"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) setArtworkUrl(URL.createObjectURL(file))
            }}
            style={{
              width: '100%',
              aspectRatio: '1',
              position: 'relative',
              cursor: 'pointer',
              backgroundColor: '#0A0A0A',
              borderBottom: '1px solid #1A1A1A',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              {artworkUrl ? (
                <motion.img
                  key={artworkUrl}
                  src={artworkUrl}
                  alt="Release artwork"
                  className="artwork-img"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 0.2s' }}
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 10, border: '1px dashed #2A2A2A', margin: 16, borderRadius: 8,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#2A2A2A',
                  }}>
                    Drop Artwork Here
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {artworkUrl && (
              <div
                className="artwork-pill"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#F5F5F0',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ fontSize: 11, lineHeight: 1 }}>✕</span>
                Change
              </div>
            )}
          </div>

          {/* Live preview */}
          <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{
              fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
              fontSize: 26,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: form.release_title ? '#F5F5F0' : '#2A2A2A',
              margin: 0,
            }}>
              {form.release_title || 'Your Release Title'}
            </p>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: form.artist_name ? '#8A8786' : '#2A2A2A',
              margin: 0,
            }}>
              {form.artist_name || 'Artist Name'}
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#FF4500',
                backgroundColor: '#1c0700',
                border: '1px solid #FF4500',
                borderRadius: 4,
                padding: '2px 7px',
              }}>
                {form.release_type}
              </span>
              {form.genre && (
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#8A8786',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}>
                  {form.genre}
                </span>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </>
  )
}
