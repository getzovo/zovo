'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const BB  = "'Bebas Neue', sans-serif"
const DM  = "'DM Sans', sans-serif"
const DMM = "'DM Mono', monospace"

type Status = 'green' | 'yellow' | 'red'

export interface HealthData {
  score: number
  breakdown: {
    cadence: number
    pitches: number
    catalog: number
    distribution: number
    profile: number
  }
  status: Status
  context_strings: {
    cadence: string
    pitches: string
    catalog: string
    distribution: string
    profile: string
  }
}

export const STATUS_MAP: Record<Status, { label: string; color: string }> = {
  green:  { label: 'STRONG',  color: '#22C55E' },
  yellow: { label: 'FAIR',    color: '#F59E0B' },
  red:    { label: 'AT RISK', color: '#EF4444' },
}

export const HEALTH_ROWS: { key: keyof HealthData['breakdown']; label: string; max: number }[] = [
  { key: 'cadence',      label: 'Release Cadence',     max: 30 },
  { key: 'pitches',      label: 'Pitch Activity',       max: 25 },
  { key: 'catalog',      label: 'Catalog Growth',       max: 20 },
  { key: 'distribution', label: 'Distribution',         max: 15 },
  { key: 'profile',      label: 'Profile Completeness', max: 10 },
]

export default function HealthScorePopover({
  artistId,
  children,
}: {
  artistId: string
  children: React.ReactNode
}) {
  const [open, setOpen]       = useState(false)
  const [data, setData]       = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPanelPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setOpen(true)
  }

  const handleMouseLeave = () => setOpen(false)

  // Fetch on every open
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setData(null)
    setError(false)
    fetch('/api/roster/health-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist_id: artistId }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: HealthData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [open, artistId])

  const status = data ? STATUS_MAP[data.status] : null

  const panel = mounted && open && panelPos ? createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: panelPos.top,
        right: panelPos.right,
        zIndex: 9999,
        width: 320,
        backgroundColor: '#0A0A0A',
        border: '1px solid #1F1F1F',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      }}
    >
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786' }}>
            Loading…
          </span>
        </div>
      )}

      {!loading && error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EF4444' }}>
            Failed to load
          </span>
        </div>
      )}

      {!loading && data && status && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: BB, fontSize: 72, lineHeight: 1, color: '#F5F5F0', letterSpacing: '0.02em' }}>
              {data.score}
            </span>
            <span style={{
              fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: status.color, backgroundColor: `${status.color}1A`,
              padding: '5px 10px', borderRadius: 6, marginBottom: 8,
            }}>
              {status.label}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {HEALTH_ROWS.map(({ key, label, max }) => {
              const val = data.breakdown[key]
              const pct = max > 0 ? Math.round((val / max) * 100) : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: DM, fontSize: 13, color: '#F5F5F0' }}>{label}</span>
                    <span style={{ fontFamily: DMM, fontSize: 11, letterSpacing: '0.05em', color: '#8A8786' }}>
                      {val}/{max}
                    </span>
                  </div>
                  <div style={{ height: 4, backgroundColor: '#1F1F1F', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#FF4500', borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontFamily: DM, fontSize: 11, color: '#8A8786', lineHeight: 1.4 }}>
                    {data.context_strings[key]}
                  </span>
                </div>
              )
            })}
          </div>

          <p style={{
            fontFamily: DMM, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#8A8786', margin: 0, lineHeight: 1.8,
            borderTop: '1px solid #1F1F1F', paddingTop: 14,
          }}>
            70–100 STRONG · 40–69 FAIR · 0–39 AT RISK
          </p>
        </>
      )}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="View health score breakdown"
        aria-expanded={open}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'default', display: 'block', lineHeight: 0 }}
      >
        {children}
      </button>
      {panel}
    </>
  )
}
