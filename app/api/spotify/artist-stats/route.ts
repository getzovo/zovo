import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFreshToken } from '@/lib/spotify'

interface SpotifyAlbum {
  name: string
  album_type: string
  release_date: string
  images: { url: string }[]
}

interface SpotifyAlbumsPage {
  items: SpotifyAlbum[]
  next: string | null
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_id')
    .eq('id', user.id)
    .single()

  if (!profile?.artist_id) {
    return NextResponse.json({ error: 'no_artist_id' }, { status: 400 })
  }

  const accessToken = await getFreshToken(supabase, user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'spotify_not_connected' }, { status: 400 })
  }

  // Fetch full catalog, paginating through all pages
  let albums: SpotifyAlbum[] = []
  let url: string | null =
    `https://api.spotify.com/v1/artists/${profile.artist_id}/albums` +
    `?include_groups=album,single&limit=50&market=US`

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) break
    const page: SpotifyAlbumsPage = await res.json()
    albums = [...albums, ...page.items]
    url = page.next
  }

  if (albums.length === 0) {
    return NextResponse.json({
      total_releases: 0,
      latest_drop: null,
      release_pace: null,
      recent_releases: [],
      full_catalog: [],
    })
  }

  albums.sort(
    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  )

  const latest = albums[0]
  const latest_drop = {
    name: latest.name,
    date: latest.release_date,
    type: latest.album_type,
  }

  // Avg weeks between the last 5 releases
  let release_pace: number | null = null
  const last5 = albums.slice(0, Math.min(5, albums.length))
  if (last5.length >= 2) {
    const dates = last5.map(a => new Date(a.release_date).getTime())
    const diffs: number[] = []
    for (let i = 0; i < dates.length - 1; i++) diffs.push(dates[i] - dates[i + 1])
    const avgMs = diffs.reduce((s, d) => s + d, 0) / diffs.length
    release_pace = Math.round(avgMs / (1000 * 60 * 60 * 24 * 7))
  }

  const toRelease = (a: SpotifyAlbum) => ({
    name: a.name,
    type: a.album_type,
    year: a.release_date.slice(0, 4),
    cover_art_url: a.images[0]?.url ?? null,
  })

  return NextResponse.json({
    total_releases: albums.length,
    latest_drop,
    release_pace,
    recent_releases: albums.slice(0, 5).map(toRelease),
    full_catalog: albums.slice(0, 20).map(toRelease),
  })
}
