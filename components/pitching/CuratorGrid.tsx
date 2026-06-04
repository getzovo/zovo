'use client'

import { useState } from 'react'
import CuratorCard, { type Curator } from './CuratorCard'

export default function CuratorGrid({ curators }: { curators: Curator[] }) {
  const [activeGenre, setActiveGenre] = useState<string>('All')

  const genres = ['All', ...Array.from(
    new Set(curators.flatMap((c) => c.genre_tags ?? []))
  ).sort()]

  const visible = activeGenre === 'All'
    ? curators
    : curators.filter((c) => c.genre_tags?.includes(activeGenre))

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {genres.map((genre) => {
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
