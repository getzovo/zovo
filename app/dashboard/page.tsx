'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

interface LatestDrop { name: string; date: string; type: string }
interface Release { name: string; type: string; year: string; cover_art_url: string | null }

interface ArtistStats {
  total_releases: number;
  latest_drop: LatestDrop | null;
  release_pace: number | null;
  recent_releases: Release[];
  full_catalog: Release[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const skeletonStyle: React.CSSProperties = {
  backgroundColor: '#e8e4dc',
  borderRadius: 6,
  animation: 'pulse 1.4s ease-in-out infinite',
};

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: 'var(--off-white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ ...skeletonStyle, height: 10, width: '40%' }} />
      <div style={{ ...skeletonStyle, height: 28, width: '60%' }} />
      <div style={{ ...skeletonStyle, height: 10, width: '50%' }} />
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--off-white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 28,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
        lineHeight: 1,
        marginBottom: 6,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>
        {subtext}
      </div>
    </div>
  );
}

// ── No artist CTA ─────────────────────────────────────────────────────────────

function AddArtistUrlCTA() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: 'var(--ink-muted)',
        margin: '0 0 6px',
      }}>
        Add your Spotify artist URL to see your catalog stats
      </p>
      <a
        href="/dashboard/settings"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink)',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Go to Settings →
      </a>
    </div>
  );
}

// ── Recent releases ───────────────────────────────────────────────────────────

function RecentReleases({ releases }: { releases: Release[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: 16,
      }}>
        Recent Releases
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {releases.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {r.cover_art_url ? (
              <img
                src={r.cover_art_url}
                alt={r.name}
                width={40}
                height={40}
                style={{ borderRadius: 4, flexShrink: 0, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: 'var(--border)', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--ink)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {r.name}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  backgroundColor: 'var(--border)',
                  padding: '2px 5px',
                  borderRadius: 3,
                }}>
                  {r.type}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: 'var(--ink-muted)',
                }}>
                  {r.year}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Discography grid ──────────────────────────────────────────────────────────

function DiscographyGrid({ catalog }: { catalog: Release[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: 16,
      }}>
        Discography
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
      }}>
        {catalog.map((r, i) => (
          <div key={i}>
            {r.cover_art_url ? (
              <img
                src={r.cover_art_url}
                alt={r.name}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 6,
                backgroundColor: 'var(--border)',
              }} />
            )}
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'var(--ink)',
              fontWeight: 500,
              marginTop: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {r.name}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: 'var(--ink-muted)',
              marginTop: 2,
            }}>
              {r.year}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasArtistId, setHasArtistId] = useState(false);
  const [stats, setStats] = useState<ArtistStats | null>(null);

  const now = new Date();
  const dateHeader = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const greeting = getGreeting(now.getHours());

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('artist_name, artist_id')
        .eq('id', user.id)
        .single();
      if (profile?.artist_name) setArtistName(profile.artist_name);

      if (!profile?.artist_id) {
        setLoading(false);
        return;
      }

      setHasArtistId(true);
      const statsRes = await fetch('/api/spotify/artist-stats');
      if (statsRes.ok) {
        const data: ArtistStats = await statsRes.json();
        setStats(data);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 800px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ padding: '40px 40px 60px' }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 10,
        }}>
          {dateHeader}
        </div>

        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 500,
          fontSize: 32,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          lineHeight: 1.2,
          margin: '0 0 32px',
        }}>
          {greeting}{artistName ? `, ${artistName}` : ''}.
        </h1>

        {loading ? (
          <div className="stat-grid" style={{ marginBottom: 32 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !hasArtistId ? (
          <AddArtistUrlCTA />
        ) : (
          <>
            <div className="stat-grid" style={{ marginBottom: 40 }}>
              <StatCard
                label="Releases"
                value={stats ? String(stats.total_releases) : '--'}
                subtext="Total catalog"
              />
              <StatCard
                label="Latest Drop"
                value={stats?.latest_drop?.name ?? '--'}
                subtext={stats?.latest_drop ? daysAgo(stats.latest_drop.date) : 'Most recent release'}
              />
              <StatCard
                label="Release Pace"
                value={stats?.release_pace != null ? `Every ${stats.release_pace}w` : '--'}
                subtext="Avg between drops"
              />
            </div>

            {stats && stats.recent_releases.length > 0 && (
              <RecentReleases releases={stats.recent_releases} />
            )}

            {stats && stats.full_catalog.length > 0 && (
              <DiscographyGrid catalog={stats.full_catalog} />
            )}
          </>
        )}
      </div>
    </>
  );
}
