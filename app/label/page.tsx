'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ManagerRow {
  id: string
  name: string
  roster_count: number
  pitches_30d: number
  avg_health: number
  last_active: string
  status: 'ACTIVE' | 'IDLE' | 'INACTIVE'
}

interface LabelStats {
  total_managers: number
  total_artists: number
  avg_health: number
}

interface LabelData {
  managers: ManagerRow[]
  label_name: string
  stats: LabelStats
}

interface InviteRow {
  id: string
  email: string
  status: string
  created_at: string
}

interface ActivityItem {
  pitch_id: string
  artist_name: string
  curator_name: string
  playlist_name: string
  manager_name: string
  status: string
  created_at: string
}

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE:   { color: '#22C55E', bg: '#22C55E1A', border: '#22C55E33' },
  IDLE:     { color: '#F59E0B', bg: '#F59E0B1A', border: '#F59E0B33' },
  INACTIVE: { color: '#EF4444', bg: '#EF44441A', border: '#EF444433' },
}

const mono = (size = 10): React.CSSProperties => ({
  fontFamily: "'DM Mono', monospace",
  fontSize: size,
  letterSpacing: '0.1em',
})

function daysAgo(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const PITCH_STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  sent:    { color: '#22C55E', bg: '#22C55E1A', border: '#22C55E33' },
  draft:   { color: '#F59E0B', bg: '#F59E0B1A', border: '#F59E0B33' },
  opened:  { color: '#3B82F6', bg: '#3B82F61A', border: '#3B82F633' },
}

const COL_HEADERS = ['MANAGER', 'ARTISTS', 'PITCHES (30D)', 'AVG HEALTH', 'LAST ACTIVE', 'STATUS']

const thStyle: React.CSSProperties = {
  ...mono(9),
  textTransform: 'uppercase',
  color: '#5A5A58',
  letterSpacing: '0.12em',
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 400,
  whiteSpace: 'nowrap',
}

export default function LabelPage() {
  const [data, setData] = useState<LabelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  const loadInvites = useCallback(() => {
    fetch('/api/label/invites')
      .then(r => r.json())
      .then((d: { invites: InviteRow[] }) => setInvites(d.invites ?? []))
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/label/managers')
      .then(r => r.json())
      .then((d: LabelData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const loadActivity = useCallback(() => {
    setActivityLoading(true)
    fetch('/api/label/activity')
      .then(r => r.json())
      .then((d: { activity: ActivityItem[] }) => { setActivity(d.activity ?? []); setActivityLoading(false) })
      .catch(() => setActivityLoading(false))
  }, [])

  useEffect(() => { load(); loadInvites(); loadActivity() }, [load, loadInvites, loadActivity])

  async function handleSendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    const res = await fetch('/api/label/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    setInviting(false)
    if (!res.ok) {
      const d = await res.json()
      setInviteError(d.error ?? 'Failed to send invite.')
      return
    }
    setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`)
    setInviteEmail('')
    loadInvites()
  }

  const managers = data?.managers ?? []
  const stats = data?.stats ?? { total_managers: 0, total_artists: 0, avg_health: 0 }
  const labelName = data?.label_name ?? ''

  const statCards = [
    { label: 'TOTAL MANAGERS',   value: loading ? '--' : String(stats.total_managers), subtext: 'UNDER YOUR LABEL' },
    { label: 'TOTAL ARTISTS',    value: loading ? '--' : String(stats.total_artists),  subtext: 'ACROSS ALL ROSTERS' },
    { label: 'AVG HEALTH SCORE', value: loading ? '--' : stats.avg_health > 0 ? String(stats.avg_health) : '--', subtext: 'ACROSS ALL ARTISTS' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid #1A1A1A' }}>
        <Link href="/label" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 26, color: '#F5F5F0', letterSpacing: '0.05em' }}>
            ZOVO<span style={{ color: '#FF4500' }}>.</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {labelName && (
            <span style={{ ...mono(11), textTransform: 'uppercase', color: '#5A5A58' }}>
              {labelName}
            </span>
          )}
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{ ...mono(11), textTransform: 'uppercase', color: '#8A8786', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div style={{ padding: '40px 40px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 64, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, margin: '0 0 6px' }}>
            LABEL DASHBOARD
          </h1>
          {labelName && (
            <div style={{ ...mono(11), textTransform: 'uppercase', color: '#8A8786' }}>
              {labelName}
            </div>
          )}
        </div>

        {/* Stat cards */}
        <style>{`
          .lbl-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
          @media(max-width:800px){.lbl-stats{grid-template-columns:repeat(2,1fr)}}
          @media(max-width:480px){.lbl-stats{grid-template-columns:1fr}}
          .mgr-table { width: 100%; border-collapse: collapse; }
          .mgr-table td { padding: 14px 16px; border-bottom: 1px solid #1A1A1A; vertical-align: middle; }
          .mgr-table tr:last-child td { border-bottom: none; }
          .mgr-table tr:hover td { background: #0D0D0D; }
        `}</style>

        <div className="lbl-stats" style={{ marginBottom: 48 }}>
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}
            >
              <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8786', marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 36, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>
              <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5A5A58' }}>{card.subtext}</div>
            </motion.div>
          ))}
        </div>

        {/* Manager table */}
        <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8786', marginBottom: 16 }}>
          Manager Performance
        </div>

        {loading ? (
          <div style={{ ...mono(11), textTransform: 'uppercase', color: '#5A5A58', padding: '40px 0' }}>LOADING...</div>
        ) : managers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: '80px 40px', textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 36, color: '#F5F5F0', marginBottom: 10, letterSpacing: '0.02em' }}>
              NO MANAGERS YET.
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', marginBottom: 28 }}>
              No managers added yet. Invite a manager to get started.
            </div>
            <button
              onClick={() => { setShowModal(true); setInviteSuccess(''); setInviteError('') }}
              style={{ backgroundColor: '#FF4500', color: 'white', ...mono(11), textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 24px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              + INVITE MANAGER
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="mgr-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1A1A1A' }}>
                    {COL_HEADERS.map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {managers.map((mgr, i) => {
                    const st = STATUS_STYLE[mgr.status] ?? STATUS_STYLE.INACTIVE
                    return (
                      <motion.tr
                        key={mgr.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        style={{ cursor: 'default' }}
                      >
                        {/* Manager name */}
                        <td>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', fontWeight: 500 }}>
                            {mgr.name}
                          </span>
                        </td>

                        {/* Artists */}
                        <td>
                          <span style={{ ...mono(11), color: '#8A8786' }}>
                            {mgr.roster_count}
                          </span>
                        </td>

                        {/* Pitches 30d */}
                        <td>
                          <span style={{ ...mono(11), color: '#8A8786' }}>
                            {mgr.pitches_30d}
                          </span>
                        </td>

                        {/* Avg health */}
                        <td>
                          <span style={{
                            ...mono(11),
                            color: mgr.avg_health >= 70 ? '#22C55E' : mgr.avg_health >= 40 ? '#F59E0B' : mgr.avg_health > 0 ? '#EF4444' : '#5A5A58',
                          }}>
                            {mgr.avg_health > 0 ? mgr.avg_health : '--'}
                          </span>
                        </td>

                        {/* Last active */}
                        <td>
                          <span style={{ ...mono(11), color: '#8A8786' }}>
                            {daysAgo(mgr.last_active)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td>
                          <span style={{
                            ...mono(9),
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: st.color,
                            backgroundColor: st.bg,
                            border: `1px solid ${st.border}`,
                            padding: '3px 8px',
                            borderRadius: 4,
                            display: 'inline-block',
                          }}>
                            {mgr.status}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pitch Activity Feed */}
        <div style={{ marginTop: 48 }}>
          <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8786', marginBottom: 16 }}>
            Pitch Activity
          </div>
          {activityLoading ? (
            <div style={{ ...mono(11), textTransform: 'uppercase', color: '#5A5A58', padding: '20px 0' }}>LOADING...</div>
          ) : activity.length === 0 ? (
            <div style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: '40px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786' }}>
                No pitch activity yet. Invite managers to start tracking pitches.
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, overflow: 'hidden' }}
            >
              {activity.map((item, i) => {
                const ps = PITCH_STATUS_STYLE[item.status] ?? PITCH_STATUS_STYLE.draft
                return (
                  <div
                    key={item.pitch_id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: i < activity.length - 1 ? '1px solid #1A1A1A' : 'none',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.artist_name}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.curator_name}{item.playlist_name ? ` · ${item.playlist_name}` : ''}
                      </div>
                      <div style={{ ...mono(10), color: '#5A5A58', marginTop: 3 }}>
                        {item.manager_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{
                        ...mono(9), textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: ps.color, backgroundColor: ps.bg, border: `1px solid ${ps.border}`,
                        padding: '3px 8px', borderRadius: 4, display: 'inline-block',
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                      <span style={{ ...mono(10), color: '#5A5A58', whiteSpace: 'nowrap' }}>
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* Pending invites list */}
        {invites.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8786', marginBottom: 16 }}>
              Invites
            </div>
            <div style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, overflow: 'hidden' }}>
              {invites.map((inv, i) => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < invites.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0' }}>{inv.email}</span>
                  <span style={{
                    ...mono(9),
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: inv.status === 'accepted' ? '#22C55E' : '#F59E0B',
                    backgroundColor: inv.status === 'accepted' ? '#22C55E1A' : '#F59E0B1A',
                    border: `1px solid ${inv.status === 'accepted' ? '#22C55E33' : '#F59E0B33'}`,
                    padding: '3px 8px',
                    borderRadius: 4,
                    display: 'inline-block',
                  }}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32, width: '100%', maxWidth: 440 }}>
            <div style={{ ...mono(10), textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8786', marginBottom: 16 }}>
              Invite a Manager
            </div>
            <h2 style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 32, color: '#F5F5F0', margin: '0 0 24px', letterSpacing: '0.02em' }}>
              Add to your label.
            </h2>

            {inviteSuccess ? (
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#22C55E', margin: '0 0 20px' }}>{inviteSuccess}</p>
                <button
                  onClick={() => { setInviteSuccess(''); setShowModal(false) }}
                  style={{ width: '100%', background: '#1A1A1A', color: '#F5F5F0', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '14px', borderRadius: 8, border: '1px solid #2A2A2A', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ ...mono(11), textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Manager email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendInvite() }}
                    placeholder="manager@example.com"
                    autoFocus
                    style={{ width: '100%', background: '#0A0A0A', border: '1px solid #2A2A2A', padding: '14px 16px', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F5F5F0', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {inviteError && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>{inviteError}</p>
                )}
                <button
                  onClick={handleSendInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  style={{ width: '100%', background: '#FF4500', color: '#F5F5F0', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '14px', borderRadius: 8, border: 'none', cursor: inviting || !inviteEmail.trim() ? 'default' : 'pointer', opacity: inviting || !inviteEmail.trim() ? 0.6 : 1 }}
                >
                  {inviting ? 'Sending…' : 'Send Invite'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ width: '100%', background: 'none', color: '#8A8786', fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
