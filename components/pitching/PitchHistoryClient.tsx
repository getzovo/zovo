'use client'

import { motion, AnimatePresence, type TargetAndTransition, type Transition } from 'framer-motion'

type StatusKey = 'draft' | 'sent' | 'opened' | 'replied'

type Curator = { name: string; playlist_name: string }
export interface PitchRow {
  id: string
  release_name: string
  status: string | null
  created_at: string
  curators: Curator | Curator[] | null
}

const STATUS_LABEL: Record<StatusKey, string> = {
  draft: 'Draft',
  sent: 'Sent',
  opened: 'Opened',
  replied: 'Replied',
}

const STATUS_STYLE: Record<StatusKey, React.CSSProperties> = {
  draft:   { color: '#8A8786',  backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' },
  sent:    { color: '#F5F5F0',  backgroundColor: '#FF4500', border: '1px solid #FF4500' },
  opened:  { color: '#22C55E',  backgroundColor: '#052e16', border: '1px solid #22C55E' },
  replied: { color: '#FF4500',  backgroundColor: '#1c0700', border: '1px solid #FF4500' },
}

// pulse config per status — null means static
const PULSE: Record<StatusKey, { animate: TargetAndTransition; transition: Transition } | null> = {
  draft:   null,
  sent:    null,
  opened:  {
    animate:    { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] },
    transition: { delay: 0.15, duration: 2,   repeat: Infinity, ease: 'easeInOut' },
  },
  replied: {
    animate:    { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] },
    transition: { delay: 0.15, duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
}

function StatusBadge({ status }: { status: string }) {
  const key = (STATUS_LABEL[status as StatusKey] ? status : 'draft') as StatusKey
  const pulse = PULSE[key]

  const badgeStyle: React.CSSProperties = {
    ...STATUS_STYLE[key],
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderRadius: 4,
    padding: '3px 8px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  }

  return (
    <AnimatePresence mode="wait">
      {/* outer: status-change entrance/exit */}
      <motion.span
        key={key}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{ display: 'inline-block' }}
      >
        {/* inner: continuous pulse for opened/replied */}
        <motion.span
          animate={pulse?.animate ?? {}}
          transition={pulse?.transition ?? {}}
          style={badgeStyle}
        >
          {STATUS_LABEL[key]}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  )
}

export default function PitchHistoryClient({ pitches }: { pitches: PitchRow[] }) {
  return (
    <div style={{ marginTop: 56 }}>
      <h2 style={{
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontWeight: 400,
        fontSize: 28,
        letterSpacing: '0.02em',
        color: '#F5F5F0',
        margin: '0 0 20px',
      }}>
        Pitch History
      </h2>

      {!pitches.length ? (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#8A8786',
          margin: 0,
        }}>
          Your sent pitches will appear here.
        </p>
      ) : (
        <div style={{ border: '1px solid #1A1A1A', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}>
            <thead>
              <tr style={{ backgroundColor: '#0A0A0A' }}>
                {(['Release', 'Curator', 'Status', 'Date'] as const).map(col => (
                  <th key={col} style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#8A8786',
                    fontWeight: 400,
                    textAlign: 'left',
                    padding: '10px 16px',
                    borderBottom: '1px solid #1A1A1A',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitches.map((pitch, i) => {
                const curator = Array.isArray(pitch.curators) ? pitch.curators[0] : pitch.curators
                const date = new Date(pitch.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
                return (
                  <motion.tr
                    key={pitch.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.06 }}
                    whileHover={{ backgroundColor: '#161616' }}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid #1A1A1A',
                      backgroundColor: '#111111',
                      cursor: 'default',
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#F5F5F0', fontWeight: 500 }}>
                      {pitch.release_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8A8786' }}>
                      {curator ? (
                        <span>
                          {curator.name}
                          <span style={{ color: '#2A2A2A', margin: '0 6px' }}>·</span>
                          <span style={{ fontSize: 13 }}>{curator.playlist_name}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={pitch.status ?? 'draft'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8A8786', whiteSpace: 'nowrap' }}>
                      {date}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
