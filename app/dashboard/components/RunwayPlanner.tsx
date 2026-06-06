'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Release {
  name: string
  release_date: string
}

interface RunwayResult {
  recommendation: string
  window_start: string
  window_end: string
  cadence_weeks: number
}

interface Props {
  releases: Release[]
  tier: string | null
}

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatWindowDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${d}`
}

const cardBase: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #2A2A2A',
  borderRadius: 12,
  padding: '28px 28px 24px',
  position: 'relative',
  overflow: 'hidden',
  marginBottom: 40,
}

const monoMeta: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
}

const dateHeadline: React.CSSProperties = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
  fontSize: 48,
  color: '#FF4500',
  lineHeight: 1.05,
  margin: '8px 0 16px',
  letterSpacing: '0.02em',
}

export default function RunwayPlanner({ releases, tier }: Props) {
  const [result, setResult] = useState<RunwayResult | null>(null)
  const [gated, setGated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  const prevTierRef = useRef<string | null | undefined>(undefined)
  const hasUnlockedRef = useRef(false)

  // Initial fetch — unchanged
  useEffect(() => {
    fetch('/api/runway/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releases, tier }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.gated) {
          setGated(true)
        } else if (data.error) {
          setError(data.error)
        } else {
          setResult(data)
        }
      })
      .catch(() => setError('Could not load recommendation.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tier transition watcher — triggers unlock animation
  useEffect(() => {
    const prev = prevTierRef.current
    prevTierRef.current = tier
    if (prev === undefined) return // skip initial render

    const wasFree = prev === 'free' || prev === null
    const isNowPaid = tier === 'artist' || tier === 'pro'

    if (wasFree && isNowPaid && !hasUnlockedRef.current) {
      hasUnlockedRef.current = true
      setUnlocking(true)
      fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releases, tier }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.gated && !data.error) {
            setResult(data)
            setGated(false)
          }
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier])

  if (loading) {
    return (
      <div style={cardBase}>
        <style>{`@keyframes rp-pulse{0%,100%{opacity:.35}50%{opacity:.8}}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ width: 180, height: 11, background: '#2A2A2A', borderRadius: 4, animation: 'rp-pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: 280, height: 52, background: '#2A2A2A', borderRadius: 6, animation: 'rp-pulse 1.5s ease-in-out infinite 0.1s' }} />
          <div style={{ width: '100%', height: 11, background: '#2A2A2A', borderRadius: 4, animation: 'rp-pulse 1.5s ease-in-out infinite 0.2s' }} />
          <div style={{ width: '75%', height: 11, background: '#2A2A2A', borderRadius: 4, animation: 'rp-pulse 1.5s ease-in-out infinite 0.3s' }} />
          <div style={{ width: 160, height: 11, background: '#2A2A2A', borderRadius: 4, animation: 'rp-pulse 1.5s ease-in-out infinite 0.4s' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={cardBase}>
        <p style={{ ...monoMeta, margin: 0 }}>{error}</p>
      </div>
    )
  }

  // ── Unlock animation ──────────────────────────────────────────────────────
  if (unlocking) {
    return (
      <div style={cardBase}>

        {/* Content layer — blur clears (Step 3: 400ms delay, 1.2s) */}
        <motion.div
          initial={{ filter: 'blur(5px)' }}
          animate={{ filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
        >
          <div style={monoMeta}>Your next drop window</div>

          {/* Date headline — Step 4: opacity 0→1, scale 0.95→1, 600ms, delay 1.4s */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
              style={dateHeadline}
            >
              {formatWindowDate(result.window_start)} – {formatWindowDate(result.window_end)}
            </motion.div>
          )}

          {/* Recommendation — Step 5a: delay 1.8s */}
          {result && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.8 }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#8A8786', margin: '0 0 20px', lineHeight: 1.6 }}
            >
              {result.recommendation}
            </motion.p>
          )}

          {/* Cadence — Step 5b: delay 1.9s */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.9 }}
              style={{ ...monoMeta, marginBottom: 24 }}
            >
              Avg release cadence — {result.cadence_weeks} wks
            </motion.div>
          )}

          {/* CTA buttons — Step 6: y 10→0, opacity 0→1, delay 2.0s */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 2.0 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <Link href="/dashboard/pitching" style={{
                display: 'inline-block', background: '#FF4500', color: '#F5F5F0',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                padding: '12px 20px', borderRadius: 8, textDecoration: 'none',
              }}>
                Generate Pitch
              </Link>
              <Link href="/dashboard/distribution" style={{
                display: 'inline-block', background: 'transparent', color: '#F5F5F0',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                padding: '12px 20px', borderRadius: 8, border: '1px solid #2A2A2A', textDecoration: 'none',
              }}>
                Start Distribution
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Overlay — Steps 1 & 2 */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,10,10,0.72)',
            gap: 16, padding: 24, textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Label — Step 1: 300ms */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786' }}
          >
            Artist Feature
          </motion.div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F5F5F0', margin: 0, lineHeight: 1.5 }}>
            Release Runway is an Artist feature.<br />Upgrade to unlock.
          </p>
          {/* Button — Step 1: 300ms */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/dashboard/settings" style={{
              display: 'inline-block', background: '#FF4500', color: '#F5F5F0',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
              padding: '12px 24px', borderRadius: 8, textDecoration: 'none',
            }}>
              Upgrade to Artist
            </Link>
          </motion.div>
        </motion.div>

      </div>
    )
  }

  // ── Static gated (no animation) ───────────────────────────────────────────
  if (gated) {
    return (
      <div style={cardBase}>
        <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
          <div style={monoMeta}>Your next drop window</div>
          <div style={dateHeadline}>AUG 04 – AUG 11</div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#8A8786', margin: '0 0 20px', lineHeight: 1.6 }}>
            Based on your release history, your momentum is strongest when you
            drop within a consistent cadence. Your audience engagement peaks in
            the first 72 hours — use that window.
          </p>
          <div style={monoMeta}>Avg release cadence — 6 wks</div>
        </div>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.72)',
          gap: 16, padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786' }}>
            Artist Feature
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F5F5F0', margin: 0, lineHeight: 1.5 }}>
            Release Runway is an Artist feature.<br />Upgrade to unlock.
          </p>
          <Link href="/dashboard/settings" style={{
            display: 'inline-block', background: '#FF4500', color: '#F5F5F0',
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
            padding: '12px 24px', borderRadius: 8, textDecoration: 'none',
          }}>
            Upgrade to Artist
          </Link>
        </div>
      </div>
    )
  }

  if (!result) return null

  // ── Unlocked (immediate, no animation) ───────────────────────────────────
  return (
    <div style={cardBase}>
      <div style={monoMeta}>Your next drop window</div>

      <div style={dateHeadline}>
        {formatWindowDate(result.window_start)} – {formatWindowDate(result.window_end)}
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#8A8786', margin: '0 0 20px', lineHeight: 1.6 }}>
        {result.recommendation}
      </p>

      <div style={{ ...monoMeta, marginBottom: 24 }}>
        Avg release cadence — {result.cadence_weeks} wks
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dashboard/pitching" style={{
          display: 'inline-block', background: '#FF4500', color: '#F5F5F0',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
          padding: '12px 20px', borderRadius: 8, textDecoration: 'none',
        }}>
          Generate Pitch
        </Link>
        <Link href="/dashboard/distribution" style={{
          display: 'inline-block', background: 'transparent', color: '#F5F5F0',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
          padding: '12px 20px', borderRadius: 8, border: '1px solid #2A2A2A', textDecoration: 'none',
        }}>
          Start Distribution
        </Link>
      </div>
    </div>
  )
}
