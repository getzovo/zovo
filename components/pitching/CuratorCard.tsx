'use client'

import { useState } from 'react'
import PitchModal from './PitchModal'

export interface Curator {
  id: string
  name: string
  playlist_name: string
  genre_tags: string[]
  platform: string | null
  followers: number | null
  submission_email: string
  notes: string | null
  active: boolean
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export default function CuratorCard({ curator }: { curator: Curator }) {
  const { name, playlist_name, genre_tags, platform, followers, notes } = curator
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
    <div style={{
      backgroundColor: 'var(--warm-white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Top: name + platform badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: 14,
          color: 'var(--ink)',
          lineHeight: 1.3,
        }}>
          {name}
        </span>
        {platform && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            backgroundColor: 'var(--off-white)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '2px 6px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            {platform}
          </span>
        )}
      </div>

      {/* Playlist name */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: 'var(--ink-muted)',
        margin: 0,
        lineHeight: 1.4,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      } as React.CSSProperties}>
        {playlist_name}
      </p>

      {/* Genre tags */}
      {genre_tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {genre_tags.map((tag) => (
            <span key={tag} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              backgroundColor: 'var(--off-white)',
              border: '1px solid var(--border)',
              borderRadius: 3,
              padding: '2px 5px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {notes && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'var(--ink-muted)',
          margin: 0,
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {notes}
        </p>
      )}

      {/* Bottom: followers + submit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: 4,
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: 'var(--ink-soft)',
        }}>
          {followers != null ? `${formatFollowers(followers)} followers` : '—'}
        </span>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: '#fff',
            backgroundColor: 'var(--accent)',
            border: 'none',
            borderRadius: 5,
            padding: '5px 12px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Submit
        </button>
      </div>
    </div>

    {modalOpen && (
      <PitchModal curator={curator} onClose={() => setModalOpen(false)} />
    )}
    </>
  )
}
