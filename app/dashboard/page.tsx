import { cookies, headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import GenerateReportButton from '@/components/dashboard/GenerateReportButton'
import DashboardClient from './components/DashboardClient'
import ManagerDashboard from './components/ManagerDashboard'
import LabelDashboard from './components/LabelDashboard'

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

interface Release { name: string; type: string; year: string; release_date: string; cover_art_url: string | null }

interface ArtistStats {
  total_releases: number
  latest_drop: { name: string; date: string } | null
  release_pace: number | null
  recent_releases: Release[]
  full_catalog: Release[]
}

async function fetchArtistStats(): Promise<ArtistStats | null> {
  const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const host = headers().get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  try {
    const res = await fetch(`${proto}://${host}/api/spotify/artist-stats`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Components ────────────────────────────────────────────────────────────────

function RecentReleases({ releases }: { releases: Release[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#8A8786',
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
              <div style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: '#2A2A2A', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#F5F5F0',
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
                  color: '#8A8786',
                  backgroundColor: '#2A2A2A',
                  padding: '2px 5px',
                  borderRadius: 3,
                }}>
                  {r.type}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786' }}>
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
        color: '#8A8786',
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
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, backgroundColor: '#2A2A2A' }} />
            )}
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: '#F5F5F0',
              fontWeight: 500,
              marginTop: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {r.name}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8A8786', marginTop: 2 }}>
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
    .select('artist_name, artist_id, tier, account_type')
    .eq('id', user!.id)
    .single()

  if (profile?.account_type === 'manager') return <ManagerDashboard />
  if (profile?.account_type === 'label') return <LabelDashboard />

  const stats = profile?.artist_id ? await fetchArtistStats() : null

  const now = new Date()
  const dateHeader = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
  const greeting = getGreeting(now.getHours())
  const artistName = profile?.artist_name ?? ''

  const cards = [
    {
      label: 'Releases',
      value: stats ? String(stats.total_releases) : '--',
      subtext: 'Total catalog',
    },
    {
      label: 'Latest Drop',
      value: stats?.latest_drop?.name ?? '--',
      subtext: stats?.latest_drop ? daysAgo(stats.latest_drop.date) : 'Most recent release',
    },
    {
      label: 'Release Pace',
      value: stats?.release_pace != null ? `Every ${stats.release_pace}w` : '--',
      subtext: 'Avg between drops',
    },
  ]

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
        <DashboardClient
          greeting={`${greeting}${artistName ? `, ${artistName}` : ''}`}
          dateHeader={dateHeader}
          hasArtistId={!!profile?.artist_id}
          cards={cards}
          fullCatalog={(stats?.full_catalog ?? []).map(r => ({ name: r.name, release_date: r.release_date }))}
          tier={profile?.tier ?? null}
        />

        {profile?.artist_id && (
          <>
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
