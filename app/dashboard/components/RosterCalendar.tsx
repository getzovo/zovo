'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface CatalogRelease { name: string; type: string; year: string; release_date: string; cover_art_url: string | null }
interface CatalogCache { total_releases: number; latest_drop: { name: string; date: string; type: string } | null; release_pace: number | null; recent_releases: CatalogRelease[]; full_catalog: CatalogRelease[] }
interface ArtistProfile { id: string; artist_name: string | null; genre: string | null; artist_id: string | null; catalog_cache: CatalogCache | null }
interface RosterEntry { claimed: boolean; profile: ArtistProfile | null; roster_id: string; artist_name_override: string | null }

const COLORS = ['#FF4500', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16']
const DAY_PX = 7
const WEEK_PX = DAY_PX * 7
const ROW_H = 52
const LABEL_W = 128

function toX(date: Date, start: Date) {
  return Math.round((date.getTime() - start.getTime()) / 86400000) * DAY_PX
}

export default function RosterCalendar({ entries }: { entries: RosterEntry[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const today = useMemo(() => new Date(), [])

  const tlStart = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - 84)
    d.setDate(d.getDate() - d.getDay())
    return d
  }, [today])

  const tlEnd = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 140)
    return d
  }, [today])

  const totalDays = Math.ceil((tlEnd.getTime() - tlStart.getTime()) / 86400000)
  const totalWidth = totalDays * DAY_PX

  const weeks = useMemo(() => {
    const result: { x: number; label: string }[] = []
    const c = new Date(tlStart)
    while (c < tlEnd) {
      result.push({ x: toX(c, tlStart), label: c.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
      c.setDate(c.getDate() + 7)
    }
    return result
  }, [tlStart, tlEnd])

  const claimed = entries.filter(e => e.claimed && e.profile)

  interface ReleaseDot { x: number; name: string; type: string }
  const artistRows = useMemo(() => claimed.map((entry, i) => {
    const color = COLORS[i % COLORS.length]
    const cache = entry.profile!.catalog_cache
    const all = [...(cache?.full_catalog ?? []), ...(cache?.recent_releases ?? [])]
    const seen = new Set<string>()
    const dots: ReleaseDot[] = []
    for (const r of all) {
      if (!r.release_date) continue
      const key = r.release_date + r.name
      if (seen.has(key)) continue
      seen.add(key)
      const d = new Date(r.release_date)
      if (d >= tlStart && d <= tlEnd) dots.push({ x: toX(d, tlStart), name: r.name, type: r.type })
    }

    let runwayX: number | null = null
    if (cache?.latest_drop?.date && cache.release_pace) {
      const next = new Date(new Date(cache.latest_drop.date).getTime() + cache.release_pace * WEEK_PX / DAY_PX * 86400000 / 7 * 7 * 86400000)
      if (next >= tlStart && next <= tlEnd) runwayX = toX(next, tlStart)
    }

    return { entry, color, dots, runwayX, name: entry.profile!.artist_name ?? entry.artist_name_override ?? 'Unknown' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [claimed, tlStart, tlEnd])

  interface Conflict { artistA: string; artistB: string; month: string }
  const conflicts = useMemo(() => {
    const result: Conflict[] = []
    for (let i = 0; i < artistRows.length; i++) {
      for (let j = i + 1; j < artistRows.length; j++) {
        const a = artistRows[i]; const b = artistRows[j]
        outer: for (const da of a.dots) {
          for (const db of b.dots) {
            if (Math.abs(da.x - db.x) <= DAY_PX * 14) {
              const d = new Date(tlStart.getTime() + (da.x / DAY_PX) * 86400000)
              result.push({ artistA: a.name, artistB: b.name, month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
              break outer
            }
          }
        }
      }
    }
    return result
  }, [artistRows, tlStart])

  const todayX = toX(today, tlStart)

  if (claimed.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ marginTop: 56 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 16 }}>
        RELEASE CALENDAR
      </div>

      {conflicts.map((c, i) => (
        <div key={i} style={{ backgroundColor: '#EAB30810', border: '1px solid #EAB30830', borderRadius: 6, padding: '10px 16px', marginBottom: 10, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#EAB308', letterSpacing: '0.04em', lineHeight: 1.5 }}>
          RELEASE CONFLICT DETECTED — {c.artistA} and {c.artistB} are both dropping in {c.month}. Consider staggering.
        </div>
      ))}

      <div style={{ position: 'relative', overflowX: 'hidden' }}>
        {tooltip && (
          <div style={{ position: 'absolute', left: tooltip.x + LABEL_W + 8, top: tooltip.y, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, padding: '6px 10px', zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F5F5F0' }}>{tooltip.text}</div>
          </div>
        )}

        <div style={{ display: 'flex' }}>
          <div style={{ flexShrink: 0, width: LABEL_W }}>
            <div style={{ height: 28 }} />
            {artistRows.map(row => (
              <div key={row.entry.roster_id} style={{ height: ROW_H, display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 14, color: row.color, letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: LABEL_W - 8 }}>
                  {row.name}
                </span>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <div style={{ width: totalWidth, position: 'relative', minHeight: 28 + artistRows.length * ROW_H }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ position: 'absolute', left: w.x, top: 0, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2A2A2A', letterSpacing: '0.04em', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  {w.label}
                </div>
              ))}

              <div style={{ position: 'absolute', left: todayX, top: 20, bottom: 0, width: 1, backgroundColor: '#FF450033', zIndex: 1 }} />

              {artistRows.map((row, rowIdx) => {
                const top = 28 + rowIdx * ROW_H
                return (
                  <div key={row.entry.roster_id}>
                    <div style={{ position: 'absolute', left: 0, top: top + ROW_H / 2, right: 0, height: 1, backgroundColor: '#111111' }} />

                    {row.runwayX !== null && (
                      <div style={{ position: 'absolute', left: row.runwayX, top: top + 10, width: WEEK_PX * 3, height: ROW_H - 20, backgroundColor: `${row.color}12`, borderRadius: 4, border: `1px dashed ${row.color}30`, zIndex: 1 }} />
                    )}

                    {row.dots.map((dot, di) => (
                      <div
                        key={di}
                        onMouseEnter={() => setTooltip({ x: dot.x, y: top, text: `${dot.name} (${dot.type})` })}
                        onMouseLeave={() => setTooltip(null)}
                        style={{ position: 'absolute', left: dot.x - 5, top: top + ROW_H / 2 - 5, width: 10, height: 10, borderRadius: '50%', backgroundColor: row.color, cursor: 'pointer', zIndex: 2 }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
