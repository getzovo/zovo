import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/AppLayout'

function formatDaysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function formatHoursAgo(dateStr: string) {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
  if (hours < 1) return 'Just now'
  return `${hours}h ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function calcReleasePace(albums: { release_date: string }[]) {
  if (albums.length < 2) return 'N/A'
  const sorted = [...albums].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
  const recent = sorted.slice(0, 5)
  let total = 0
  for (let i = 0; i < recent.length - 1; i++) {
    total += Math.abs(new Date(recent[i].release_date).getTime() - new Date(recent[i + 1].release_date).getTime()) / 86400000
  }
  const weeks = Math.round(total / (recent.length - 1) / 7)
  return `Every ${weeks} week${weeks !== 1 ? 's' : ''}`
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="card">
      <p className="label mb-2">{label}</p>
      <p className="text-xl font-medium truncate mb-0.5" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-xs" style={{ color: '#8A8786' }}>{subtext}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.onboarding_complete) redirect('/onboarding')

  // Fetch Spotify data server-side using service role (tokens from DB)
  let artistAlbums: any[] = []
  let recentlyPlayed: any[] = []

  const { data: tokenRecord } = await supabase.from('spotify_tokens').select('*').eq('user_id', user.id).single()

  if (tokenRecord && profile.artist_id) {
    // Check if token is still valid
    let accessToken = tokenRecord.access_token
    if (new Date(tokenRecord.expires_at) <= new Date(Date.now() + 60000)) {
      // Refresh token
      const refreshRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokenRecord.refresh_token }),
      })
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json()
        accessToken = refreshed.access_token
        await supabase.from('spotify_tokens').update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        }).eq('user_id', user.id)
      }
    }

    const [albumRes, recentRes] = await Promise.allSettled([
      fetch(`https://api.spotify.com/v1/artists/${profile.artist_id}/albums?limit=20&include_groups=album,single&market=US`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 300 },
      }),
      fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }),
    ])

    if (albumRes.status === 'fulfilled' && albumRes.value.ok) {
      const d = await albumRes.value.json()
      artistAlbums = d.items || []
    }
    if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
      const d = await recentRes.value.json()
      recentlyPlayed = d.items || []
    }
  }

  const latestRelease = artistAlbums[0]
  const lastPlayed = recentlyPlayed[0]

  return (
    <AppLayout tier={profile.tier}>
      <div className="mb-8">
        <p className="label mb-1">{formatDate()}</p>
        <h1 className="text-4xl" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.03em' }}>
          {getGreeting()}, {profile.artist_name || 'artist'}.
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Releases" value={String(artistAlbums.length || '—')} subtext="Total catalog" />
        <StatCard label="Latest Drop" value={latestRelease?.name || '—'} subtext={latestRelease ? formatDaysAgo(latestRelease.release_date) : 'No releases'} />
        <StatCard label="Release Pace" value={calcReleasePace(artistAlbums)} subtext="Avg between drops" />
        <StatCard label="Last Played" value={lastPlayed?.track?.name || '—'} subtext={lastPlayed ? lastPlayed.track.artists.map((a: any) => a.name).join(', ') : 'No recent plays'} />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <div className="card">
          <p className="label mb-4">Recent Releases</p>
          {artistAlbums.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {artistAlbums.slice(0, 5).map((album: any) => (
                <div key={album.id} className="flex items-center gap-3">
                  {album.images?.[0]?.url
                    ? <Image src={album.images[0].url} alt={album.name} width={40} height={40} className="rounded" />
                    : <div className="w-10 h-10 rounded" style={{ backgroundColor: '#E2DED8' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{album.name}</p>
                    <p className="text-xs" style={{ color: '#8A8786' }}>{new Date(album.release_date).getFullYear()}</p>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786', backgroundColor: '#F2EFEA', padding: '2px 6px', borderRadius: '4px' }}>
                    {album.album_type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4 text-center" style={{ color: '#8A8786' }}>
              {profile.artist_id ? 'No releases found.' : 'Add your Spotify artist URL in settings to see releases.'}
            </p>
          )}
        </div>

        <div className="card">
          <p className="label mb-4">Recently Played</p>
          {recentlyPlayed.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {recentlyPlayed.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.track?.album?.images?.[0]?.url
                    ? <Image src={item.track.album.images[0].url} alt={item.track.name} width={40} height={40} className="rounded" />
                    : <div className="w-10 h-10 rounded" style={{ backgroundColor: '#E2DED8' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.track?.name}</p>
                    <p className="text-xs truncate" style={{ color: '#8A8786' }}>{item.track?.artists?.map((a: any) => a.name).join(', ')}</p>
                  </div>
                  <span className="label shrink-0">{formatHoursAgo(item.played_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4 text-center" style={{ color: '#8A8786' }}>
              Connect your Spotify account to see listening history.
            </p>
          )}
        </div>
      </div>

      {artistAlbums.length > 0 && (
        <div className="card">
          <p className="label mb-4">Discography</p>
          <div className="grid grid-cols-5 gap-4">
            {artistAlbums.slice(0, 20).map((album: any) => (
              <div key={album.id}>
                {album.images?.[0]?.url
                  ? <Image src={album.images[0].url} alt={album.name} width={120} height={120} className="rounded w-full aspect-square object-cover" />
                  : <div className="rounded aspect-square w-full" style={{ backgroundColor: '#E2DED8' }} />}
                <p className="text-xs mt-1.5 truncate font-medium">{album.name}</p>
                <p className="text-xs" style={{ color: '#8A8786' }}>{new Date(album.release_date).getFullYear()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
