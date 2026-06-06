'use client'

import { useState, useEffect } from 'react'
import { type Curator } from '@/components/pitching/CuratorCard'

interface CatalogRelease { name: string; type: string; year: string; release_date: string; cover_art_url: string | null }
interface CatalogCache { total_releases: number; latest_drop: { name: string; date: string; type: string } | null; release_pace: number | null; recent_releases: CatalogRelease[]; full_catalog: CatalogRelease[] }
interface ArtistProfile { id: string; artist_name: string | null; genre: string | null; artist_id: string | null; catalog_cache: CatalogCache | null; tier: string | null }
interface RosterEntry { claimed: boolean; profile: ArtistProfile | null; roster_id: string; pitch_count_30d: number; dist_count_30d: number; artist_name_override: string | null }

interface GeneratedPitch { rosterId: string; artistName: string; pitchId: string | null; pitchBody: string; error?: string }

const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
const BEBAS: React.CSSProperties = { fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontWeight: 400 }

export default function BulkPitchModal({ entries, onClose }: { entries: RosterEntry[]; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [curators, setCurators] = useState<Curator[]>([])
  const [curatorQuery, setCuratorQuery] = useState('')
  const [selectedCurator, setSelectedCurator] = useState<Curator | null>(null)
  const [selectedArtistIds, setSelectedArtistIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)
  const [pitches, setPitches] = useState<GeneratedPitch[]>([])
  const [sendingAll, setSendingAll] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const claimed = entries.filter(e => e.claimed && e.profile)

  useEffect(() => {
    fetch('/api/curators').then(r => r.json()).then(d => setCurators(Array.isArray(d) ? d : []))
  }, [])

  const visibleCurators = curators.filter(c => {
    const q = curatorQuery.trim().toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.playlist_name.toLowerCase().includes(q)
  })

  function toggleArtist(id: string) {
    setSelectedArtistIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })
  }

  const selectedEntries = claimed.filter(e => selectedArtistIds.has(e.roster_id))

  async function generateAll() {
    if (!selectedCurator || selectedEntries.length === 0) return
    setStep(3)
    setGenerating(true)
    setGenerateProgress(0)
    const results: GeneratedPitch[] = []

    for (let i = 0; i < selectedEntries.length; i++) {
      setGenerateProgress(i + 1)
      const entry = selectedEntries[i]
      const cache = entry.profile!.catalog_cache
      const latest = cache?.latest_drop ?? (cache?.recent_releases?.[0]
        ? { name: cache.recent_releases[0].name, date: cache.recent_releases[0].release_date, type: cache.recent_releases[0].type }
        : null)

      if (!latest) {
        results.push({ rosterId: entry.roster_id, artistName: entry.profile!.artist_name ?? 'Unknown', pitchId: null, pitchBody: '', error: 'No releases found' })
        continue
      }

      try {
        const res = await fetch('/api/pitches/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            curatorId: selectedCurator.id,
            curatorName: selectedCurator.name,
            playlistName: selectedCurator.playlist_name,
            curatorNotes: selectedCurator.notes,
            genreTags: selectedCurator.genre_tags,
            releaseName: latest.name,
            releaseType: latest.type,
            releaseDate: latest.date,
            artistNameOverride: entry.profile!.artist_name,
          }),
        })
        const data = await res.json()
        results.push({ rosterId: entry.roster_id, artistName: entry.profile!.artist_name ?? 'Unknown', pitchId: data.pitchId ?? null, pitchBody: data.pitch ?? '', error: res.ok ? undefined : (data.error ?? 'Generation failed') })
      } catch {
        results.push({ rosterId: entry.roster_id, artistName: entry.profile!.artist_name ?? 'Unknown', pitchId: null, pitchBody: '', error: 'Network error' })
      }
    }

    setGenerating(false)
    setPitches(results)
    setStep(4)
  }

  function updatePitchBody(rosterId: string, body: string) {
    setPitches(prev => prev.map(p => p.rosterId === rosterId ? { ...p, pitchBody: body } : p))
  }

  async function sendAll() {
    if (!selectedCurator) return
    setSendingAll(true)
    const sendable = pitches.filter(p => p.pitchId && !p.error && !sentIds.has(p.rosterId))
    for (const p of sendable) {
      await fetch('/api/pitches/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchId: p.pitchId, curatorId: selectedCurator.id }),
      }).catch(() => {})
      setSentIds(prev => { const n = new Set(prev); n.add(p.rosterId); return n })
    }
    setSendingAll(false)
  }

  const stepLabels = ['SELECT CURATOR', 'SELECT ARTISTS', 'GENERATING', 'REVIEW & SEND']

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 860, backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 40, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2 style={{ ...BEBAS, fontSize: 36, letterSpacing: '0.02em', color: '#F5F5F0', margin: 0, lineHeight: 1 }}>{stepLabels[step - 1]}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ ...MONO, fontSize: 11, letterSpacing: '0.1em', color: '#8A8786' }}>0{step} / 04</span>
            <button onClick={onClose} style={{ backgroundColor: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6, color: '#8A8786', ...MONO, fontSize: 11, letterSpacing: '0.05em', padding: '6px 12px', cursor: 'pointer' }}>CLOSE</button>
          </div>
        </div>

        {step === 1 && (
          <div>
            <input value={curatorQuery} onChange={e => setCuratorQuery(e.target.value)} placeholder="Search curators or playlists…" style={{ display: 'block', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0', backgroundColor: '#111111', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', outline: 'none', marginBottom: 20 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, maxHeight: 420, overflowY: 'auto', marginBottom: 24 }}>
              {visibleCurators.map(c => (
                <div key={c.id} onClick={() => setSelectedCurator(c)} style={{ backgroundColor: '#111111', border: `1px solid ${selectedCurator?.id === c.id ? '#FF4500' : '#1A1A1A'}`, borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#F5F5F0', marginBottom: 6 }}>{c.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#8A8786', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{c.playlist_name}</div>
                  {c.followers != null && <div style={{ ...MONO, fontSize: 10, color: '#5A5A58' }}>{c.followers >= 1000 ? `${(c.followers / 1000).toFixed(0)}k` : c.followers} followers</div>}
                </div>
              ))}
              {visibleCurators.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5A5A58', gridColumn: '1 / -1' }}>No curators found.</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} disabled={!selectedCurator} style={{ backgroundColor: selectedCurator ? '#FF4500' : '#2A2A2A', color: selectedCurator ? '#F5F5F0' : '#5A5A58', ...MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: 6, border: 'none', cursor: selectedCurator ? 'pointer' : 'default' }}>NEXT →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ ...MONO, fontSize: 11, color: '#8A8786', letterSpacing: '0.08em', marginBottom: 20 }}>
              Pitching to: <span style={{ color: '#F5F5F0' }}>{selectedCurator?.name} — {selectedCurator?.playlist_name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', marginBottom: 24 }}>
              {claimed.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#5A5A58' }}>No claimed artists on your roster yet.</div>}
              {claimed.map(entry => {
                const name = entry.profile!.artist_name ?? 'Unknown'
                const genre = entry.profile!.genre ?? '--'
                const latest = entry.profile!.catalog_cache?.latest_drop?.name ?? entry.profile!.catalog_cache?.recent_releases?.[0]?.name ?? '--'
                const sel = selectedArtistIds.has(entry.roster_id)
                return (
                  <div key={entry.roster_id} onClick={() => toggleArtist(entry.roster_id)} style={{ display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#111111', border: `1px solid ${sel ? '#FF4500' : '#1A1A1A'}`, borderRadius: 8, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                    <div style={{ width: 18, height: 18, border: `1.5px solid ${sel ? '#FF4500' : '#3A3A3A'}`, borderRadius: 4, backgroundColor: sel ? '#FF4500' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 18, color: '#F5F5F0', letterSpacing: '0.02em' }}>{name}</div>
                      <div style={{ ...MONO, fontSize: 10, color: '#8A8786', marginTop: 2 }}>{genre} · {latest}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ backgroundColor: 'transparent', border: '1px solid #2A2A2A', color: '#8A8786', ...MONO, fontSize: 11, letterSpacing: '0.08em', padding: '12px 20px', borderRadius: 6, cursor: 'pointer' }}>← BACK</button>
              <button onClick={generateAll} disabled={selectedArtistIds.size === 0} style={{ backgroundColor: selectedArtistIds.size > 0 ? '#FF4500' : '#2A2A2A', color: selectedArtistIds.size > 0 ? '#F5F5F0' : '#5A5A58', ...MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: 6, border: 'none', cursor: selectedArtistIds.size > 0 ? 'pointer' : 'default' }}>GENERATE PITCHES →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ ...MONO, fontSize: 11, color: generating ? '#FF4500' : '#22c55e', letterSpacing: '0.1em', marginBottom: 28 }}>
              {generating ? `GENERATING ${generateProgress} OF ${selectedEntries.length}...` : 'COMPLETE'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440, margin: '0 auto' }}>
              {selectedEntries.map((entry, i) => {
                const isDone = i < generateProgress - 1 || (i < generateProgress && !generating)
                const isActive = generating && i === generateProgress - 1
                return (
                  <div key={entry.roster_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#111111', borderRadius: 8, border: '1px solid #1A1A1A' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F5F5F0' }}>{entry.profile!.artist_name}</span>
                    <span style={{ ...MONO, fontSize: 10, color: isDone ? '#22c55e' : isActive ? '#FF4500' : '#5A5A58', letterSpacing: '0.08em' }}>
                      {isDone ? 'DONE' : isActive ? '...' : 'PENDING'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ ...MONO, fontSize: 11, color: '#8A8786', letterSpacing: '0.08em', marginBottom: 20 }}>
              Curator: <span style={{ color: '#F5F5F0' }}>{selectedCurator?.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 460, overflowY: 'auto', marginBottom: 24 }}>
              {pitches.map(p => (
                <div key={p.rosterId} style={{ backgroundColor: '#111111', border: `1px solid ${sentIds.has(p.rosterId) ? '#22c55e33' : '#1A1A1A'}`, borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 20, color: '#F5F5F0', letterSpacing: '0.02em' }}>{p.artistName}</span>
                    {sentIds.has(p.rosterId) && <span style={{ ...MONO, fontSize: 9, color: '#22c55e', letterSpacing: '0.1em' }}>SENT</span>}
                    {p.error && <span style={{ ...MONO, fontSize: 9, color: '#ef4444', letterSpacing: '0.1em' }}>{p.error}</span>}
                  </div>
                  {p.pitchBody && (
                    <textarea value={p.pitchBody} onChange={e => updatePitchBody(p.rosterId, e.target.value)} rows={6} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 6, padding: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#F5F5F0', lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...MONO, fontSize: 10, color: '#5A5A58' }}>{sentIds.size} of {pitches.filter(p => !p.error && p.pitchId).length} sent</div>
              <button onClick={sendAll} disabled={sendingAll} style={{ backgroundColor: '#FF4500', color: '#F5F5F0', ...MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: 6, border: 'none', cursor: sendingAll ? 'default' : 'pointer', opacity: sendingAll ? 0.7 : 1 }}>
                {sendingAll ? 'SENDING...' : 'SEND ALL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
