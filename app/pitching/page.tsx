'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'
import type { Curator, Pitch } from '@/lib/types'

const GENRES = ['ALL', 'HIP-HOP', 'R&B', 'POP', 'COUNTRY', 'EDM', 'LATIN']

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#F2EFEA', color: '#8A8786' },
  sent: { bg: '#DBEAFE', color: '#1D4ED8' },
  opened: { bg: '#FEF3C7', color: '#92400E' },
  replied: { bg: '#D1FAE5', color: '#065F46' },
}

interface SpotifyAlbumItem {
  id: string
  name: string
  album_type: string
  release_date: string
  images: { url: string }[]
}

interface GeneratedPitch {
  curator: Curator
  pitch_body: string
  loading: boolean
  saved: boolean
}

export default function PitchingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedRelease, setSelectedRelease] = useState<SpotifyAlbumItem | null>(null)
  const [releases, setReleases] = useState<SpotifyAlbumItem[]>([])
  const [curators, setCurators] = useState<Curator[]>([])
  const [selectedCurators, setSelectedCurators] = useState<Curator[]>([])
  const [genreFilter, setGenreFilter] = useState('ALL')
  const [pitches, setPitches] = useState<GeneratedPitch[]>([])
  const [pitchHistory, setPitchHistory] = useState<Pitch[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [viewingPitch, setViewingPitch] = useState<Pitch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/spotify/artist-stats').then((r) => r.json()).catch(() => []),
      fetch('/api/pitches').then((r) => r.json()).catch(() => []),
    ]).then(([albums, history]) => {
      setReleases(Array.isArray(albums) ? albums : [])
      setPitchHistory(Array.isArray(history) ? history : [])

      // Calculate monthly count
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const count = (Array.isArray(history) ? history : []).filter(
        (p: Pitch) => new Date(p.created_at) >= startOfMonth
      ).length
      setMonthlyCount(count)
      setLoading(false)
    })

    fetch('/api/curators').then((r) => r.json()).then((d) => setCurators(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    const url = genreFilter === 'ALL' ? '/api/curators' : `/api/curators?genre=${genreFilter.toLowerCase().replace('&', '-')}`
    fetch(url).then((r) => r.json()).then((d) => setCurators(Array.isArray(d) ? d : []))
  }, [genreFilter])

  function toggleCurator(curator: Curator) {
    setSelectedCurators((prev) => {
      if (prev.find((c) => c.id === curator.id)) return prev.filter((c) => c.id !== curator.id)
      if (prev.length >= 5) return prev
      return [...prev, curator]
    })
  }

  async function generatePitches() {
    if (!selectedRelease) return
    setStep(3)
    const initial = selectedCurators.map((c) => ({ curator: c, pitch_body: '', loading: true, saved: false }))
    setPitches(initial)

    for (let i = 0; i < selectedCurators.length; i++) {
      const curator = selectedCurators[i]
      try {
        const res = await fetch('/api/pitches/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artist_name: profile?.artist_name,
            release_name: selectedRelease.name,
            release_type: selectedRelease.album_type,
            release_year: new Date(selectedRelease.release_date).getFullYear(),
            curator_name: curator.name,
            playlist_name: curator.playlist_name,
            genre: curator.genre_tags[0],
            notes: curator.notes,
          }),
        })
        const data = await res.json()
        setPitches((prev) => prev.map((p, idx) => idx === i ? { ...p, pitch_body: data.pitch_body || '', loading: false } : p))
      } catch {
        setPitches((prev) => prev.map((p, idx) => idx === i ? { ...p, pitch_body: 'Error generating pitch. Please try again.', loading: false } : p))
      }
    }
  }

  async function savePitch(pitch: GeneratedPitch) {
    const res = await fetch('/api/pitches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curator_id: pitch.curator.id,
        release_name: selectedRelease?.name,
        release_type: selectedRelease?.album_type,
        pitch_body: pitch.pitch_body,
        status: 'draft',
      }),
    })
    if (res.ok) {
      setPitches((prev) => prev.map((p) => p.curator.id === pitch.curator.id ? { ...p, saved: true } : p))
    }
  }

  async function sendPitch(pitch: GeneratedPitch) {
    // Save first, then get ID
    const saveRes = await fetch('/api/pitches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curator_id: pitch.curator.id,
        release_name: selectedRelease?.name,
        release_type: selectedRelease?.album_type,
        pitch_body: pitch.pitch_body,
        status: 'draft',
      }),
    })
    const saved = await saveRes.json()
    if (!saved.id) return

    await fetch(`/api/pitches/${saved.id}/send`, { method: 'POST' })
    setPitches((prev) => prev.map((p) => p.curator.id === pitch.curator.id ? { ...p, saved: true } : p))
    setMonthlyCount((c) => c + 1)
  }

  const isFreeTier = profile?.tier === 'free'
  const limitReached = isFreeTier && monthlyCount >= 3

  return (
    <AppLayout tier={profile?.tier}>
      <div className="mb-8">
        <h1 className="text-4xl" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.03em' }}>Pitching</h1>
        <p className="mt-1" style={{ color: '#8A8786' }}>Submit your music to playlist curators.</p>
      </div>

      {/* Steps */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-xl mb-4">Select a release to pitch</h2>
          {loading ? (
            <p className="text-sm" style={{ color: '#8A8786' }}>Loading your releases...</p>
          ) : releases.length === 0 ? (
            <p className="text-sm" style={{ color: '#8A8786' }}>No releases found. Add your Spotify artist URL in Settings.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {releases.map((album) => (
                <button key={album.id} onClick={() => { setSelectedRelease(album); setStep(2) }}
                  className="text-left rounded-lg p-3 transition-colors"
                  style={{ border: '1px solid #E2DED8', backgroundColor: '#FAF8F5' }}
                >
                  {album.images?.[0]?.url
                    ? <Image src={album.images[0].url} alt={album.name} width={120} height={120} className="rounded w-full aspect-square object-cover mb-2" />
                    : <div className="rounded aspect-square w-full mb-2" style={{ backgroundColor: '#E2DED8' }} />}
                  <p className="text-sm font-medium truncate">{album.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8A8786' }}>{album.album_type}</span>
                    <span style={{ color: '#E2DED8' }}>·</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', color: '#8A8786' }}>{new Date(album.release_date).getFullYear()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedRelease && (
        <div>
          <button onClick={() => setStep(1)} className="mb-4 text-sm flex items-center gap-1" style={{ color: '#8A8786' }}>← Back</button>
          <div className="card mb-4">
            <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid #E2DED8' }}>
              {selectedRelease.images?.[0]?.url && <Image src={selectedRelease.images[0].url} alt={selectedRelease.name} width={48} height={48} className="rounded" />}
              <div>
                <p className="font-medium">{selectedRelease.name}</p>
                <p className="label">{selectedRelease.album_type} · {new Date(selectedRelease.release_date).getFullYear()}</p>
              </div>
            </div>
            <h2 className="text-xl mb-1">Choose curators</h2>
            {isFreeTier && (
              <div className="mb-4 px-3 py-2 rounded-md text-sm" style={{ backgroundColor: '#F2EFEA', border: '1px solid #E2DED8' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em' }}>
                  {monthlyCount} of 3 pitches used this month
                </span>
                {limitReached && (
                  <span className="ml-2" style={{ color: '#E8440A', fontFamily: 'DM Mono, monospace', fontSize: '10px' }}>· LIMIT REACHED</span>
                )}
              </div>
            )}
          </div>

          {/* Genre filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {GENRES.map((g) => (
              <button key={g} onClick={() => setGenreFilter(g)}
                style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em',
                  padding: '4px 12px', borderRadius: '20px', border: '1px solid',
                  backgroundColor: genreFilter === g ? '#111010' : 'transparent',
                  borderColor: genreFilter === g ? '#111010' : '#E2DED8',
                  color: genreFilter === g ? '#FAF8F5' : '#8A8786',
                  cursor: 'pointer',
                }}
              >{g}</button>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            {curators.map((curator) => {
              const isSelected = selectedCurators.some((c) => c.id === curator.id)
              return (
                <div key={curator.id}
                  onClick={() => toggleCurator(curator)}
                  className="card cursor-pointer"
                  style={{ border: isSelected ? '2px solid #111010' : '1px solid #E2DED8', backgroundColor: isSelected ? '#F2EFEA' : '#FAF8F5' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{curator.playlist_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8A8786' }}>{curator.name}</p>
                      <p className="text-xs mt-1.5" style={{ color: '#3d3c3c' }}>{curator.notes}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {curator.genre_tags.map((tag) => (
                          <span key={tag} style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: '#F2EFEA', color: '#8A8786', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2DED8' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-xs font-medium">{curator.followers?.toLocaleString()}</p>
                      <p className="label" style={{ fontSize: '9px' }}>followers</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#8A8786' }}>{selectedCurators.length} selected (max 5)</p>
            <button
              onClick={generatePitches}
              disabled={selectedCurators.length === 0 || limitReached}
              className="btn-primary"
            >
              Generate Pitches →
            </button>
          </div>

          {limitReached && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
              <p className="text-sm font-medium">You&apos;ve used all 3 free pitches this month.</p>
              <a href="/settings" className="text-sm mt-1 inline-block" style={{ color: '#E8440A', textDecoration: 'underline' }}>
                Upgrade to Artist for unlimited pitches →
              </a>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} className="mb-4 text-sm flex items-center gap-1" style={{ color: '#8A8786' }}>← Back</button>
          <h2 className="text-xl mb-4">Review your pitches</h2>
          <div className="space-y-6 mb-10">
            {pitches.map((pitch, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between mb-3 pb-3" style={{ borderBottom: '1px solid #E2DED8' }}>
                  <div>
                    <p className="font-medium text-sm">{pitch.curator.playlist_name}</p>
                    <p className="label mt-0.5">{pitch.curator.name}</p>
                  </div>
                  {pitch.saved && <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.08em', color: '#065F46', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '20px' }}>SAVED</span>}
                </div>
                {pitch.loading ? (
                  <p className="text-sm py-4" style={{ color: '#8A8786' }}>Generating pitch with AI...</p>
                ) : (
                  <>
                    <textarea
                      value={pitch.pitch_body}
                      onChange={(e) => setPitches((prev) => prev.map((p, idx) => idx === i ? { ...p, pitch_body: e.target.value } : p))}
                      rows={8}
                      className="input mb-3"
                      style={{ resize: 'vertical', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', lineHeight: '1.6' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => navigator.clipboard.writeText(pitch.pitch_body)} className="btn-ghost" style={{ fontSize: '13px', padding: '0.4rem 0.875rem' }}>Copy</button>
                      <button onClick={() => savePitch(pitch)} disabled={pitch.saved} className="btn-ghost" style={{ fontSize: '13px', padding: '0.4rem 0.875rem' }}>Save Draft</button>
                      <button onClick={() => sendPitch(pitch)} disabled={pitch.saved} className="btn-primary" style={{ fontSize: '13px', padding: '0.4rem 0.875rem' }}>Send →</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitch History */}
      {pitchHistory.length > 0 && (
        <div className="card mt-8">
          <p className="label mb-4">Pitch History</p>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #E2DED8' }}>
                {['Release', 'Playlist', 'Date', 'Status', ''].map((h) => (
                  <th key={h} className="label text-left pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitchHistory.map((pitch) => {
                const style = STATUS_STYLES[pitch.status] || STATUS_STYLES.draft
                return (
                  <tr key={pitch.id} style={{ borderBottom: '1px solid #E2DED8' }}>
                    <td className="py-3 pr-4 font-medium">{pitch.release_name}</td>
                    <td className="py-3 pr-4" style={{ color: '#8A8786' }}>{pitch.curator?.playlist_name || '—'}</td>
                    <td className="py-3 pr-4 label">{new Date(pitch.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <span style={{ ...style, fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '20px' }}>
                        {pitch.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => setViewingPitch(pitch)} style={{ color: '#E8440A', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pitch View Modal */}
      {viewingPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(17,16,16,0.4)' }}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#FAF8F5', border: '1px solid #E2DED8' }}>
            <div className="flex justify-between mb-4">
              <div>
                <p className="font-medium">{viewingPitch.release_name}</p>
                <p className="label mt-0.5">{viewingPitch.curator?.playlist_name || '—'}</p>
              </div>
              <button onClick={() => setViewingPitch(null)} style={{ color: '#8A8786', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#3d3c3c', lineHeight: '1.7' }}>{viewingPitch.pitch_body}</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
