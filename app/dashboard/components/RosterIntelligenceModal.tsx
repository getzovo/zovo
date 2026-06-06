'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOADING_PHRASES = [
  'ANALYZING YOUR ROSTER...',
  'READING RELEASE CADENCES...',
  'ANALYZING PITCH ACTIVITY...',
  'IDENTIFYING OPPORTUNITIES...',
  'WRITING YOUR BRIEF...',
]

const SECTION_HEADERS = [
  'ROSTER HEALTH SUMMARY',
  'ARTISTS ON PACE',
  'ARTISTS FALLING BEHIND',
  'RELEASE CONFLICTS & GAPS',
  'PITCH ACTIVITY ANALYSIS',
  'TOP 3 ACTIONS THIS WEEK',
]

interface Props {
  managerId?: string
  onClose: () => void
}

function parseBrief(brief: string): { header: string; body: string }[] {
  const sections: { header: string; body: string }[] = []
  const remaining = brief
  for (let i = 0; i < SECTION_HEADERS.length; i++) {
    const header = SECTION_HEADERS[i]
    const idx = remaining.indexOf(header)
    if (idx === -1) continue
    const afterHeader = remaining.slice(idx + header.length).trimStart()
    const nextIdx = SECTION_HEADERS.slice(i + 1)
      .map(h => afterHeader.indexOf(h))
      .filter(n => n !== -1)
      .sort((a, b) => a - b)[0]
    const body = nextIdx != null ? afterHeader.slice(0, nextIdx).trim() : afterHeader.trim()
    if (body) sections.push({ header, body })
  }
  return sections.length > 0 ? sections : [{ header: 'ROSTER BRIEF', body: brief }]
}

export default function RosterIntelligenceModal({ managerId = '', onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [brief, setBrief] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setBrief(null)
    setError(null)
    setPhraseIdx(0)
    try {
      const res = await fetch('/api/roster/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(managerId ? { manager_id: managerId } : {}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to generate brief.'); setLoading(false); return }
      setBrief(data.brief)
      setGeneratedAt(data.generated_at)
    } catch {
      setError('Failed to generate brief. Please try again.')
    }
    setLoading(false)
  }, [managerId])

  useEffect(() => { generate() }, [generate])

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length), 1800)
    return () => clearInterval(id)
  }, [loading])

  const sections = brief ? parseBrief(brief) : []

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 28, letterSpacing: '0.04em', color: '#F5F5F0', lineHeight: 1 }}>
              ROSTER INTELLIGENCE
            </div>
            {generatedAt && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', color: '#5A5A58', textTransform: 'uppercase', marginTop: 4 }}>
                Generated {new Date(generatedAt).toLocaleString()}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #2A2A2A', color: '#8A8786', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: 6 }}>
            CLOSE
          </button>
        </div>

        <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 20 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF4500' }}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={phraseIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.14em', color: '#8A8786', textTransform: 'uppercase' }}
                >
                  {LOADING_PHRASES[phraseIdx]}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#ef4444', marginBottom: 20 }}>{error}</div>
              <button onClick={generate} style={{ backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                RETRY
              </button>
            </div>
          )}

          {!loading && !error && sections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {sections.map((s, i) => (
                <motion.div key={s.header} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
                  <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 17, letterSpacing: '0.06em', color: '#FF4500', marginBottom: 8 }}>
                    {s.header}
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', lineHeight: 1.75, margin: 0 }}>
                    {s.body}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {!loading && (brief || error) && (
          <div style={{ padding: '18px 28px', borderTop: '1px solid #1A1A1A', flexShrink: 0 }}>
            <button onClick={generate} style={{ backgroundColor: 'transparent', color: '#F5F5F0', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', borderRadius: 6, border: '1px solid #3A3A3A', cursor: 'pointer' }}>
              GENERATE NEW BRIEF
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
