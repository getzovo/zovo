'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, type TargetAndTransition, type Transition } from 'framer-motion'

type StatusKey = 'draft' | 'sent' | 'opened' | 'replied'

type Curator = { name: string; playlist_name: string }
export interface PitchRow {
  id: string
  release_name: string
  status: string | null
  created_at: string
  curator_id: string | null
  curators: Curator | Curator[] | null
}

interface PitchNote {
  id: string
  user_id: string
  role: 'manager' | 'artist'
  content: string
  created_at: string
}

const STATUS_LABEL: Record<StatusKey, string> = {
  draft: 'Draft', sent: 'Sent', opened: 'Opened', replied: 'Replied',
}
const STATUS_STYLE: Record<StatusKey, React.CSSProperties> = {
  draft:   { color: '#8A8786', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' },
  sent:    { color: '#F5F5F0', backgroundColor: '#FF4500', border: '1px solid #FF4500' },
  opened:  { color: '#22C55E', backgroundColor: '#052e16', border: '1px solid #22C55E' },
  replied: { color: '#FF4500', backgroundColor: '#1c0700', border: '1px solid #FF4500' },
}
const PULSE: Record<StatusKey, { animate: TargetAndTransition; transition: Transition } | null> = {
  draft: null, sent: null,
  opened:  { animate: { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }, transition: { delay: 0.15, duration: 2,   repeat: Infinity, ease: 'easeInOut' } },
  replied: { animate: { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }, transition: { delay: 0.15, duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
}

function StatusBadge({ status }: { status: string }) {
  const key = (STATUS_LABEL[status as StatusKey] ? status : 'draft') as StatusKey
  const pulse = PULSE[key]
  const badgeStyle: React.CSSProperties = {
    ...STATUS_STYLE[key],
    fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em',
    textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px',
    display: 'inline-block', whiteSpace: 'nowrap',
  }
  return (
    <AnimatePresence mode="wait">
      <motion.span key={key} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'inline-block' }}>
        <motion.span animate={pulse?.animate ?? {}} transition={pulse?.transition ?? {}} style={badgeStyle}>
          {STATUS_LABEL[key]}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  )
}

function RoleBadge({ role }: { role: 'manager' | 'artist' }) {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: role === 'manager' ? '#FF4500' : '#22C55E',
      backgroundColor: role === 'manager' ? 'rgba(255,69,0,0.12)' : 'rgba(34,197,94,0.12)',
      border: `1px solid ${role === 'manager' ? 'rgba(255,69,0,0.3)' : 'rgba(34,197,94,0.3)'}`,
      borderRadius: 4, padding: '2px 7px', flexShrink: 0,
    }}>
      {role}
    </span>
  )
}

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function NotesThread({ pitchId }: { pitchId: string }) {
  const [notes, setNotes]     = useState<PitchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/pitches/${pitchId}/notes`)
      .then(r => r.ok ? r.json() : [])
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pitchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    // Optimistic insert — role unknown until server responds, default to current user context
    const optimistic: PitchNote = {
      id: `opt-${Date.now()}`,
      user_id: '',
      role: 'manager', // server overrides; will be replaced on success
      content: text,
      created_at: new Date().toISOString(),
    }
    setNotes(prev => [...prev, optimistic])

    try {
      const res = await fetch(`/api/pitches/${pitchId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const saved: PitchNote = await res.json()
        setNotes(prev => prev.map(n => n.id === optimistic.id ? saved : n))
      } else {
        setNotes(prev => prev.filter(n => n.id !== optimistic.id))
        setInput(text)
      }
    } catch {
      setNotes(prev => prev.filter(n => n.id !== optimistic.id))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '20px 16px 16px', backgroundColor: '#0D0D0D', borderTop: '1px solid #1A1A1A' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A58', marginBottom: 14 }}>
        PITCH NOTES
      </div>

      {loading ? (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5A5A58', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: 14 }}>
          Loading…
        </div>
      ) : notes.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5A5A58', paddingBottom: 14 }}>
          No notes yet. Start the conversation.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 260, overflowY: 'auto' }}>
          {notes.map(note => (
            <div key={note.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RoleBadge role={note.role} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5A5A58', letterSpacing: '0.04em' }}>
                  {fmt(note.created_at)}
                </span>
              </div>
              <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', lineHeight: 1.6 }}>
                {note.content}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Add a note…"
          style={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#F5F5F0',
            backgroundColor: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: 6,
            padding: '9px 12px',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#FF4500' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#2A2A2A' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#F5F5F0',
            backgroundColor: input.trim() && !sending ? '#FF4500' : '#1A1A1A',
            border: 'none',
            borderRadius: 6,
            padding: '9px 16px',
            cursor: input.trim() && !sending ? 'pointer' : 'default',
            transition: 'background-color 0.15s',
            flexShrink: 0,
          }}
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default function PitchHistoryClient({ pitches }: { pitches: PitchRow[] }) {
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [sendingIds, setSendingIds]   = useState<Set<string>>(new Set())
  const [errorIds, setErrorIds]       = useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  async function handleSend(e: React.MouseEvent, pitch: PitchRow) {
    e.stopPropagation()
    if (!pitch.curator_id || sendingIds.has(pitch.id)) return

    setSendingIds(prev => new Set(prev).add(pitch.id))
    setLocalStatus(prev => ({ ...prev, [pitch.id]: 'sent' }))
    setErrorIds(prev => { const s = new Set(prev); s.delete(pitch.id); return s })

    try {
      const res = await fetch('/api/pitches/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchId: pitch.id, curatorId: pitch.curator_id }),
      })
      if (!res.ok) throw new Error('send failed')
    } catch {
      setLocalStatus(prev => ({ ...prev, [pitch.id]: 'draft' }))
      setErrorIds(prev => new Set(prev).add(pitch.id))
    } finally {
      setSendingIds(prev => { const s = new Set(prev); s.delete(pitch.id); return s })
    }
  }

  return (
    <div style={{ marginTop: 56 }}>
      <h2 style={{
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontWeight: 400, fontSize: 28, letterSpacing: '0.02em',
        color: '#F5F5F0', margin: '0 0 20px',
      }}>
        Pitch History
      </h2>

      {!pitches.length ? (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', margin: 0 }}>
          Your sent pitches will appear here.
        </p>
      ) : (
        <div style={{ border: '1px solid #1A1A1A', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#0A0A0A' }}>
                {(['Release', 'Curator', 'Status', 'Date'] as const).map(col => (
                  <th key={col} style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#8A8786', fontWeight: 400,
                    textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #1A1A1A',
                  }}>
                    {col}
                  </th>
                ))}
                <th style={{ width: 32, borderBottom: '1px solid #1A1A1A' }} />
              </tr>
            </thead>
            <tbody>
              {pitches.map((pitch, i) => {
                const curator = Array.isArray(pitch.curators) ? pitch.curators[0] : pitch.curators
                const date = new Date(pitch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                const isOpen = expanded === pitch.id

                return (
                  <>
                    <motion.tr
                      key={pitch.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.06 }}
                      onClick={() => toggle(pitch.id)}
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid #1A1A1A',
                        backgroundColor: isOpen ? '#161616' : '#111111',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#F5F5F0', fontWeight: 500 }}>{pitch.release_name}</td>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <StatusBadge status={localStatus[pitch.id] ?? pitch.status ?? 'draft'} />
                          {(localStatus[pitch.id] ?? pitch.status) === 'draft' && pitch.curator_id && (
                            <button
                              onClick={e => handleSend(e, pitch)}
                              disabled={sendingIds.has(pitch.id)}
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500, fontSize: 11,
                                color: '#F5F5F0',
                                backgroundColor: '#FF4500',
                                border: 'none', borderRadius: 4,
                                padding: '3px 10px', cursor: sendingIds.has(pitch.id) ? 'default' : 'pointer',
                                opacity: sendingIds.has(pitch.id) ? 0.5 : 1,
                                transition: 'opacity 0.15s', whiteSpace: 'nowrap',
                              }}
                            >
                              {sendingIds.has(pitch.id) ? 'Sending…' : 'Send'}
                            </button>
                          )}
                          {errorIds.has(pitch.id) && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#EF4444' }}>
                              Failed — try again
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#8A8786', whiteSpace: 'nowrap' }}>{date}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'inline-block', color: '#5A5A58', fontSize: 12 }}
                        >
                          ▾
                        </motion.span>
                      </td>
                    </motion.tr>

                    {isOpen && (
                      <tr key={`${pitch.id}-notes`}>
                        <td colSpan={5} style={{ padding: 0, borderTop: 'none' }}>
                          <AnimatePresence>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <NotesThread pitchId={pitch.id} />
                            </motion.div>
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
