'use client'

import { useState } from 'react'
import CuratorCard, { type Curator } from './CuratorCard'

const GENRE_LABELS = [
  'All', 'Hip-Hop', 'R&B', 'Pop', 'Electronic', 'Latin',
  'Country', 'Rock', 'Jazz', 'Soul', 'Indie', 'Experimental',
] as const

type GenreLabel = typeof GENRE_LABELS[number]

const GENRE_MAP: Record<Exclude<GenreLabel, 'All'>, string[]> = {
  'Hip-Hop':      ['hip-hop', 'boom-bap', 'trap', 'rap', 'drill', 'jazz-rap', 'freestyle', 'conscious', 'lyrical', 'underground', 'hardcore'],
  'R&B':          ['r&b', 'alt-r&b', 'indie-r&b', 'neo-soul', 'slow-jams', 'urban', 'contemporary'],
  'Pop':          ['pop', 'alt-pop', 'indie-pop', 'acoustic-pop', 'bedroom-pop', 'electropop', 'soft-pop', 'stadium-pop', 'lo-fi-pop', 'synth-pop', 'teen', 'feel-good', 'buzz', 'new-releases', 'trending', 'summer', 'melodic', 'empowerment', 'female-artists', 'romantic', 'ballads', 'anthemic'],
  'Electronic':   ['electronic', 'edm', 'house', 'techno', 'dubstep', 'future-bass', 'drum-and-bass', 'lo-fi-electronic', 'bass', 'ambient', 'chillout', 'rave', 'dance', 'club', 'breaks', 'progressive', 'afrohouse', 'afrotech'],
  'Latin':        ['latin', 'latin-pop', 'latin-trap', 'reggaeton', 'bachata', 'cumbia', 'salsa', 'tropical', 'alternative-latin', 'indie-latin', 'corridos', 'norteno', 'regional', 'urban-latin', 'romantic-latin', 'mexican', 'afrobeats', 'afro-fusion'],
  'Country':      ['country', 'modern-country', 'folk-country', 'americana', 'nashville', 'pop-country', 'bro-country', 'honky-tonk', 'traditional', 'outlaw', 'red-dirt'],
  'Rock':         ['alternative', 'rock', 'hard-rock', 'punk', 'grunge', 'metal', 'garage'],
  'Jazz':         ['jazz-rap', 'jazz', 'bebop', 'swing', 'jazz-fusion'],
  'Soul':         ['soul', 'gospel-influenced', 'neo-soul', 'emotional'],
  'Indie':        ['indie-pop', 'indie-r&b', 'indie-latin', 'bedroom-pop', 'independent', 'emerging', 'scandinavian'],
  'Experimental': ['experimental', 'genre-blending', 'multi-genre', 'diverse'],
}

function matchesGenre(tags: string[], genre: Exclude<GenreLabel, 'All'>): boolean {
  const allowed = GENRE_MAP[genre]
  return tags.some((t) => allowed.includes(t.toLowerCase()))
}

export default function CuratorGrid({ curators }: { curators: Curator[] }) {
  const [activeGenre, setActiveGenre] = useState<GenreLabel>('All')

  const visible = activeGenre === 'All'
    ? curators
    : curators.filter((c) => matchesGenre(c.genre_tags ?? [], activeGenre as Exclude<GenreLabel, 'All'>))

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {GENRE_LABELS.map((genre) => {
          const isActive = genre === activeGenre
          return (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isActive ? '#fff' : 'var(--ink)',
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20,
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'background-color 0.1s, color 0.1s, border-color 0.1s',
              }}
            >
              {genre}
            </button>
          )
        })}
      </div>

      {visible.length > 0 ? (
        <div className="curator-grid">
          {visible.map((curator) => (
            <CuratorCard key={curator.id} curator={curator} />
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
        }}>
          No curators found for this genre.
        </p>
      )}
    </>
  )
}
