'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RosterIntelligenceModal from './RosterIntelligenceModal'
import AddManagerModal from './AddManagerModal'

interface ManagerCard {
  id: string; name: string; roster_count: number; avg_health: number; last_active: string
}
interface LabelStats {
  total_managers: number; total_artists: number; avg_health: number; active_this_month: number
}
interface LabelData { managers: ManagerCard[]; label_name: string; stats: LabelStats }
interface CatalogCache { total_releases?: number; release_pace?: number | null; latest_drop?: { name: string } | null }
interface RosterEntry {
  claimed: boolean
  profile: { id: string; artist_name: string | null; genre: string | null; catalog_cache: unknown; artist_id: string | null } | null
  health_score: { score: number; status: 'green' | 'yellow' | 'red' }
  roster_id: string; pitch_count_30d: number; dist_count_30d: number
  artist_name_override: string | null; genre_override: string | null
}

function daysAgo(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

function HealthDot({ score, status }: { score: number; status: string }) {
  const color = status === 'green' ? '#22c55e' : status === 'yellow' ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: `${color}22`, border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#F5F5F0', fontWeight: 700 }}>{score || '--'}</span>
    </div>
  )
}

export default function LabelDashboard() {
  const [data, setData] = useState<LabelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewingManager, setViewingManager] = useState<ManagerCard | null>(null)
  const [managerRoster, setManagerRoster] = useState<RosterEntry[] | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [intelligenceOpen, setIntelligenceOpen] = useState(false)
  const [intelligenceManagerId, setIntelligenceManagerId] = useState<string | null>(null)
  const [addManagerOpen, setAddManagerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/label/managers')
      .then(r => r.json())
      .then((d: LabelData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  async function viewRoster(manager: ManagerCard) {
    setViewingManager(manager)
    setRosterLoading(true)
    const res = await fetch(`/api/label/manager-roster?manager_id=${manager.id}`)
    const artists = await res.json()
    setManagerRoster(Array.isArray(artists) ? artists : [])
    setRosterLoading(false)
  }

  function openIntelligence(managerId: string) {
    setIntelligenceManagerId(managerId)
    setIntelligenceOpen(true)
  }

  if (loading) {
    return <div style={{ padding: 40 }}><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>LOADING LABEL...</div></div>
  }

  const stats = data?.stats ?? { total_managers: 0, total_artists: 0, avg_health: 0, active_this_month: 0 }
  const managers = data?.managers ?? []
  const labelName = data?.label_name ?? 'Your Label'

  const statCards = [
    { label: 'TOTAL MANAGERS', value: String(stats.total_managers), subtext: 'UNDER YOUR LABEL' },
    { label: 'TOTAL ARTISTS', value: String(stats.total_artists), subtext: 'ACROSS ALL ROSTERS' },
    { label: 'AVG HEALTH SCORE', value: stats.avg_health > 0 ? String(stats.avg_health) : '--', subtext: 'ACROSS ENTIRE ROSTER' },
    { label: 'ACTIVE THIS MONTH', value: String(stats.active_this_month), subtext: 'ARTISTS WITH ACTIVITY' },
  ]

  return (
    <>
      <style>{`
        .lbl-stat { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .lbl-mgr { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .lbl-art { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        @media(max-width:1100px){.lbl-stat{grid-template-columns:repeat(2,1fr)}.lbl-mgr{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.lbl-mgr,.lbl-art{grid-template-columns:1fr}.lbl-stat{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      {intelligenceOpen && intelligenceManagerId && (
        <RosterIntelligenceModal managerId={intelligenceManagerId} onClose={() => setIntelligenceOpen(false)} />
      )}
      {addManagerOpen && (
        <AddManagerModal
          onClose={() => setAddManagerOpen(false)}
          onSuccess={() => { setAddManagerOpen(false); setRefreshKey(k => k + 1) }}
        />
      )}

      <AnimatePresence>
        {viewingManager && (
          <motion.div
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#FF4500', padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <button onClick={() => { setViewingManager(null); setManagerRoster(null) }} style={{ background: 'none', border: 'none', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              ← BACK TO LABEL
            </button>
            <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 20, letterSpacing: '0.05em', color: 'white' }}>
              VIEWING MANAGER: {viewingManager.name.toUpperCase()}
            </div>
            <button onClick={() => openIntelligence(viewingManager.id)} style={{ backgroundColor: 'white', color: '#FF4500', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: 5, border: 'none', cursor: 'pointer' }}>
              ROSTER INTELLIGENCE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '40px 40px 60px' }}>
        <AnimatePresence mode="wait">
          {!viewingManager ? (
            <motion.div key="label-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 64, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, margin: 0 }}>
                  LABEL DASHBOARD
                </h1>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={() => setAddManagerOpen(true)} style={{ backgroundColor: 'transparent', color: '#F5F5F0', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 6, border: '1px solid #3A3A3A', cursor: 'pointer' }}>
                    ADD MANAGER
                  </button>
                  <button
                    onClick={() => managers.length > 0 && openIntelligence(managers[0].id)}
                    disabled={managers.length === 0}
                    style={{ backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 6, border: 'none', cursor: managers.length ? 'pointer' : 'default', opacity: managers.length ? 1 : 0.4 }}
                  >
                    ROSTER INTELLIGENCE
                  </button>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 40 }}>
                {labelName.toUpperCase()}&apos;S ROSTER OVERVIEW
              </div>

              <div className="lbl-stat" style={{ marginBottom: 48 }}>
                {statCards.map((card, i) => (
                  <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                    style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20 }}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 8 }}>{card.label}</div>
                    <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400, fontSize: 36, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786' }}>{card.subtext}</div>
                  </motion.div>
                ))}
              </div>

              {managers.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 40, color: '#F5F5F0', marginBottom: 12 }}>NO MANAGERS YET.</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', marginBottom: 28 }}>Add your first manager to get started.</div>
                  <button onClick={() => setAddManagerOpen(true)} style={{ backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 28px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                    ADD MANAGER
                  </button>
                </motion.div>
              ) : (
                <div className="lbl-mgr">
                  {managers.map((mgr, i) => (
                    <motion.div key={mgr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                      style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 24, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1.1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mgr.name}
                        </div>
                        <HealthDot score={mgr.avg_health} status={mgr.avg_health >= 70 ? 'green' : mgr.avg_health >= 40 ? 'yellow' : 'red'} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {[
                          { label: 'ROSTER', value: `${mgr.roster_count} ARTIST${mgr.roster_count !== 1 ? 'S' : ''}` },
                          { label: 'AVG HEALTH', value: mgr.avg_health > 0 ? String(mgr.avg_health) : '--' },
                          { label: 'LAST ACTIVE', value: daysAgo(mgr.last_active) },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>{row.label}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => viewRoster(mgr)} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #3A3A3A', borderRadius: 6, color: '#F5F5F0', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 0', cursor: 'pointer', marginTop: 'auto' }}>
                        VIEW ROSTER
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="manager-roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {rosterLoading ? (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>LOADING ROSTER...</div>
              ) : !managerRoster || managerRoster.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 40, color: '#F5F5F0', marginBottom: 12 }}>NO ARTISTS YET.</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786' }}>This manager hasn&apos;t added any artists.</div>
                </div>
              ) : (
                <div className="lbl-art">
                  {managerRoster.map((entry, i) => {
                    const name = entry.profile?.artist_name ?? entry.artist_name_override ?? 'Unknown Artist'
                    const genre = entry.profile?.genre ?? entry.genre_override ?? null
                    const cache = entry.profile?.catalog_cache as CatalogCache | null
                    return (
                      <motion.div key={entry.roster_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                        style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 22, letterSpacing: '0.02em', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</div>
                          <HealthDot score={entry.health_score.score} status={entry.health_score.status} />
                        </div>
                        {genre && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786', backgroundColor: '#1A1A1A', borderRadius: 4, padding: '3px 8px', alignSelf: 'flex-start' }}>{genre}</span>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {[
                            { label: 'RELEASES', value: cache?.total_releases != null ? String(cache.total_releases) : '--' },
                            { label: 'PITCHES (30D)', value: String(entry.pitch_count_30d) },
                          ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A58' }}>{row.label}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786' }}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
