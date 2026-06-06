'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AddArtistModal from './AddArtistModal'
import BulkPitchModal from './BulkPitchModal'
import RosterCalendar from './RosterCalendar'
import RosterIntelligenceModal from './RosterIntelligenceModal'

interface CatalogRelease {
  name: string; type: string; year: string; release_date: string; cover_art_url: string | null
}
interface CatalogCache {
  total_releases: number
  latest_drop: { name: string; date: string; type: string } | null
  release_pace: number | null
  recent_releases: CatalogRelease[]
  full_catalog: CatalogRelease[]
}
interface ArtistProfile {
  id: string; artist_name: string | null; genre: string | null; artist_id: string | null
  catalog_cache: CatalogCache | null; tier: string | null
}
interface HealthScore {
  score: number
  breakdown: { cadence: number; pitches: number; catalog: number; distribution: number; profile: number }
  status: 'green' | 'yellow' | 'red'
}
interface RosterEntry {
  claimed: boolean
  profile: ArtistProfile | null
  health_score: HealthScore
  roster_status: string
  roster_id: string
  invite_id: string | null
  joined_at: string | null
  pitch_count_30d: number
  dist_count_30d: number
  artist_name_override: string | null
  genre_override: string | null
  claim_email: string | null
}

function artistName(e: RosterEntry): string {
  return e.profile?.artist_name ?? e.artist_name_override ?? 'Unknown Artist'
}

function daysAgo(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

function HealthBadge({ score, status, pending }: { score: number; status: string; pending?: boolean }) {
  if (pending) {
    return (
      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, backgroundColor: '#1A1A1A', border: '1.5px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5A5A58', fontWeight: 700 }}>--</span>
      </div>
    )
  }
  const color = status === 'green' ? '#22c55e' : status === 'yellow' ? '#f59e0b' : '#ef4444'
  return (
    <motion.div
      animate={status === 'red' ? { opacity: [1, 0.5, 1], scale: [1, 1.08, 1] } : {}}
      transition={status === 'red' ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, backgroundColor: `${color}22`, border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#F5F5F0', fontWeight: 700, lineHeight: 1 }}>{score}</span>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786', maxWidth: '55%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function ArtistCard({ entry, onView }: { entry: RosterEntry; onView: () => void }) {
  const cache = entry.profile?.catalog_cache
  const name = artistName(entry)
  const genre = entry.profile?.genre ?? entry.genre_override ?? null
  const [showInviteInput, setShowInviteInput] = useState(false)
  const [inviteEmail, setInviteEmail] = useState(entry.claim_email ?? '')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    await fetch('/api/roster/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: entry.invite_id ?? entry.roster_id, email: inviteEmail }),
    }).catch(() => {})
    setInviteSending(false)
    setInviteSent(true)
    setShowInviteInput(false)
  }

  const alreadyInvited = !!entry.claim_email || inviteSent

  return (
    <div style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 24, letterSpacing: '0.02em', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {name}
        </div>
        <HealthBadge score={entry.health_score.score} status={entry.health_score.status} pending={!entry.claimed} />
      </div>

      {genre && (
        <div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786', backgroundColor: '#1A1A1A', borderRadius: 4, padding: '3px 8px' }}>
            {genre}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MiniStat label="Latest Drop" value={entry.claimed ? (cache?.latest_drop?.name?.slice(0, 20) ?? '--') : '--'} />
        <MiniStat label="Release Pace" value={entry.claimed ? (cache?.release_pace != null ? `Every ${cache.release_pace}w` : '--') : '--'} />
        <MiniStat label="Pitches (30D)" value={entry.claimed ? String(entry.pitch_count_30d) : '--'} />
      </div>

      <div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, backgroundColor: entry.claimed ? '#22c55e15' : '#1A1A1A', color: entry.claimed ? '#22c55e' : '#5A5A58', border: `1px solid ${entry.claimed ? '#22c55e33' : '#2A2A2A'}` }}>
          {entry.claimed ? 'ACTIVE' : 'PENDING'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={entry.claimed ? onView : undefined}
          style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${entry.claimed ? '#3A3A3A' : '#2A2A2A'}`, borderRadius: 6, color: entry.claimed ? '#F5F5F0' : '#3A3A3A', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 0', cursor: entry.claimed ? 'pointer' : 'default' }}
        >
          VIEW DASHBOARD
        </button>

        {!entry.claimed && (
          alreadyInvited
            ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58', textAlign: 'center', padding: '6px 0' }}>INVITE SENT</div>
            : showInviteInput
              ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="artist@email.com" style={{ flex: 1, background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 5, padding: '8px 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F5F5F0', outline: 'none' }} />
                  <button onClick={sendInvite} disabled={inviteSending} style={{ backgroundColor: '#FF4500', border: 'none', borderRadius: 5, color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px', cursor: 'pointer', flexShrink: 0 }}>
                    {inviteSending ? '...' : 'SEND'}
                  </button>
                </div>
              )
              : (
                <button onClick={() => setShowInviteInput(true)} style={{ backgroundColor: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6, color: '#8A8786', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 0', cursor: 'pointer', width: '100%' }}>
                  INVITE TO CLAIM
                </button>
              )
        )}
      </div>
    </div>
  )
}

function ArtistView({ entry }: { entry: RosterEntry }) {
  const cache = entry.profile?.catalog_cache
  const cards = [
    { label: 'RELEASES', value: cache?.total_releases != null ? String(cache.total_releases) : '--', subtext: 'TOTAL CATALOG' },
    { label: 'LATEST DROP', value: cache?.latest_drop?.name ?? '--', subtext: cache?.latest_drop ? daysAgo(cache.latest_drop.date) : 'MOST RECENT RELEASE' },
    { label: 'RELEASE PACE', value: cache?.release_pace != null ? `Every ${cache.release_pace}w` : '--', subtext: 'AVG BETWEEN DROPS' },
  ]
  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 32, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786' }}>{card.subtext}</div>
          </motion.div>
        ))}
      </div>
      {(cache?.recent_releases?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 16 }}>RECENT RELEASES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cache!.recent_releases.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {r.cover_art_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.cover_art_url} alt={r.name} width={40} height={40} style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: '#2A2A2A', flexShrink: 0 }} />
                }
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786', marginTop: 2, textTransform: 'capitalize' }}>{r.type} · {r.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(cache?.full_catalog?.length ?? 0) > 0 && (
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 16 }}>DISCOGRAPHY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {cache!.full_catalog.map((r, i) => (
              <div key={i}>
                {r.cover_art_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.cover_art_url} alt={r.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                  : <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, backgroundColor: '#2A2A2A' }} />
                }
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F5F5F0', fontWeight: 500, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786', marginTop: 2 }}>{r.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ManagerDashboard() {
  const [entries, setEntries] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingAs, setViewingAs] = useState<RosterEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [intelligenceOpen, setIntelligenceOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/roster/artists')
      .then(r => r.json())
      .then((data: RosterEntry[]) => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const claimed = entries.filter(e => e.claimed)
  const rosterCount = entries.length
  const activeCount = entries.filter(e => e.pitch_count_30d > 0 || e.dist_count_30d > 0).length
  const avgScore = claimed.length > 0 ? Math.round(claimed.reduce((s, e) => s + e.health_score.score, 0) / claimed.length) : 0

  const statCards = [
    { label: 'TOTAL ARTISTS', value: String(rosterCount), subtext: 'ON YOUR ROSTER' },
    { label: 'ACTIVE THIS MONTH', value: String(activeCount), subtext: 'PITCHED LAST 30 DAYS' },
    { label: 'AVG HEALTH SCORE', value: claimed.length > 0 ? String(avgScore) : '--', subtext: 'ACROSS ROSTER' },
  ]

  if (loading) {
    return <div style={{ padding: '40px 40px 60px' }}><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>LOADING ROSTER...</div></div>
  }

  return (
    <>
      <style>{`
        .roster-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .roster-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .roster-grid { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {modalOpen && (
        <AddArtistModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); setRefreshKey(k => k + 1) }} />
      )}
      {bulkModalOpen && (
        <BulkPitchModal entries={entries} onClose={() => setBulkModalOpen(false)} />
      )}
      {intelligenceOpen && (
        <RosterIntelligenceModal onClose={() => setIntelligenceOpen(false)} />
      )}

      <AnimatePresence>
        {viewingAs && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#FF4500', padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <button onClick={() => setViewingAs(null)} style={{ backgroundColor: 'transparent', border: 'none', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              ← BACK TO ROSTER
            </button>
            <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 20, letterSpacing: '0.05em', color: 'white' }}>
              VIEWING AS: {artistName(viewingAs).toUpperCase()}
            </div>
            <div style={{ width: 140 }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 64, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, margin: '0 0 8px' }}>ROSTER DASHBOARD</h1>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786' }}>
              MANAGING {rosterCount} ARTIST{rosterCount !== 1 ? 'S' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setBulkModalOpen(true)} style={{ backgroundColor: 'transparent', color: '#FF4500', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 6, border: '1px solid #FF4500', cursor: 'pointer' }}>
              BULK PITCH
            </button>
            <button onClick={() => setIntelligenceOpen(true)} disabled={rosterCount === 0} style={{ backgroundColor: 'transparent', color: '#F5F5F0', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 6, border: '1px solid #3A3A3A', cursor: rosterCount ? 'pointer' : 'default', opacity: rosterCount ? 1 : 0.4 }}>
              ROSTER INTELLIGENCE
            </button>
            <button onClick={() => setModalOpen(true)} style={{ backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              + ADD ARTIST
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!viewingAs ? (
            <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="stat-grid" style={{ marginBottom: 40 }}>
                {statCards.map((card, i) => (
                  <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                    style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 8 }}>{card.label}</div>
                    <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 32, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786' }}>{card.subtext}</div>
                  </motion.div>
                ))}
              </div>

              {rosterCount === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 40, color: '#F5F5F0', marginBottom: 12 }}>NO ARTISTS YET.</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', marginBottom: 28 }}>Add your first artist to get started.</div>
                  <button onClick={() => setModalOpen(true)} style={{ backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 28px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                    + ADD ARTIST
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="roster-grid">
                    {entries.map((entry, i) => (
                      <motion.div key={entry.roster_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}>
                        <ArtistCard entry={entry} onView={() => entry.claimed && setViewingAs(entry)} />
                      </motion.div>
                    ))}
                  </div>
                  <RosterCalendar entries={entries} />
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="artist-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <ArtistView entry={viewingAs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
