import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import GenerateReportButton from '@/components/dashboard/GenerateReportButton'

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

// ── Spotify ───────────────────────────────────────────────────────────────────

interface SpotifyAlbum {
  name: string
  album_type: string
  release_date: string
  images: { url: string }[]
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  console.log('[dashboard] token req — id present:', !!clientId, 'secret present:', !!clientSecret)
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[dashboard] token FAIL status=${res.status} body=${body.slice(0, 200)}`)
    return null
  }
  const { access_token, expires_in } = await res.json()
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

interface Release { name: string; type: string; year: string; cover_art_url: string | null }

interface ArtistStats {
  total_releases: number
  latest_drop: { name: string; date: string } | null
  release_pace: number | null
  recent_releases: Release[]
  full_catalog: Release[]
}

async function getArtistStats(artistId: string): Promise<ArtistStats | null> {
  const accessToken = await getAppToken()
  if (!accessToken) return null

  let albums: SpotifyAlbum[] = []
  let url: string | null =
    `https://api.spotify.com/v1/artists/${artistId}/albums` +
    `?include_groups=album,single&limit=10&market=US`

  while (url) {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[dashboard] albums FAIL status=${res.status} url=${url.slice(0, 80)} body=${body.slice(0, 200)}`)
      break
    }
    const page: { items: SpotifyAlbum[]; next: string | null } = await res.json()
    albums = [...albums, ...page.items]
    url = page.next
  }

  console.log('[dashboard] fetched albums:', albums.length, 'for artist:', artistId)
  if (albums.length === 0) return null

  albums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())

  const last5 = albums.slice(0, Math.min(5, albums.length))
  let release_pace: number | null = null
  if (last5.length >= 2) {
    const dates = last5.map(a => new Date(a.release_date).getTime())
    const diffs: number[] = []
    for (let i = 0; i < dates.length - 1; i++) diffs.push(dates[i] - dates[i + 1])
    release_pace = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length / (1000 * 60 * 60 * 24 * 7))
  }

  const toRelease = (a: SpotifyAlbum): Release => ({
    name: a.name,
    type: a.album_type,
    year: a.release_date.slice(0, 4),
    cover_art_url: a.images[0]?.url ?? null,
  })

  return {
    total_releases: albums.length,
    latest_drop: { name: albums[0].name, date: albums[0].release_date },
    release_pace,
    recent_releases: last5.map(toRelease),
    full_catalog: albums.slice(0, 20).map(toRelease),
  }
}

// ── Components ────────────────────────────────────────────────────────────────

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
  )
}

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
              // eslint-disable-next-line @next/next/no-img-element
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
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--ink-muted)' }}>
                  {r.year}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {catalog.map((r, i) => (
          <div key={i}>
            {r.cover_art_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.cover_art_url}
                alt={r.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, backgroundColor: 'var(--border)' }} />
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
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>
              {r.year}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, artist_id')
    .eq('id', user!.id)
    .single()

  const stats = profile?.artist_id ? await getArtistStats(profile.artist_id) : null

  const now = new Date()
  const dateHeader = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
  const greeting = getGreeting(now.getHours())
  const artistName = profile?.artist_name ?? ''

  return (
    <>
      <style>{`
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

        {!profile?.artist_id ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'var(--ink-muted)',
              margin: '0 0 6px',
            }}>
              Add your Spotify artist URL to see your catalog stats
            </p>
            <Link
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
            </Link>
          </div>
        ) : (
          <>
            <div className="stat-grid" style={{ marginBottom: 20 }}>
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

            <div style={{ marginBottom: 40 }}>
              <GenerateReportButton />
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
  )
}
