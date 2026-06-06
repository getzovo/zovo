// Required env vars:
//   CRON_SECRET              — Vercel passes this automatically as Authorization: Bearer <secret>
//   SUPABASE_SERVICE_ROLE_KEY — Supabase project Settings → API → service_role key
//   SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

async function getSpotifyToken(): Promise<string | null> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) return null
  const { access_token } = await res.json()
  return access_token
}

function toRelease(a: SpotifyAlbum) {
  return {
    name: a.name,
    type: a.album_type,
    year: a.release_date.slice(0, 4),
    release_date: a.release_date,
    cover_art_url: a.images[0]?.url ?? null,
  }
}

async function fetchCatalog(artistId: string, token: string): Promise<object | null> {
  let albums: SpotifyAlbum[] = []
  let url: string | null =
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50&market=US`

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`spotify_${res.status}: ${errBody.slice(0, 120)}`)
    }
    const page: SpotifyAlbumsPage = await res.json()
    albums = [...albums, ...page.items]
    url = page.next
  }

  if (albums.length === 0) return null

  albums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())

  const latest = albums[0]
  const last5 = albums.slice(0, Math.min(5, albums.length))
  let release_pace: number | null = null
  if (last5.length >= 2) {
    const dates = last5.map(a => new Date(a.release_date).getTime())
    const diffs: number[] = []
    for (let i = 0; i < dates.length - 1; i++) diffs.push(dates[i] - dates[i + 1])
    release_pace = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length / (1000 * 60 * 60 * 24 * 7))
  }

  return {
    total_releases: albums.length,
    latest_drop: { name: latest.name, date: latest.release_date, type: latest.album_type },
    release_pace,
    recent_releases: albums.slice(0, 5).map(toRelease),
    full_catalog: albums.slice(0, 20).map(toRelease),
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, artist_id, artist_name')
    .not('artist_id', 'is', null)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const token = await getSpotifyToken()
  if (!token) {
    return NextResponse.json({ error: 'spotify_auth_failed' }, { status: 503 })
  }

  let processed = 0
  let failed = 0
  const errors: string[] = []
  const list = profiles ?? []

  for (let i = 0; i < list.length; i++) {
    const profile = list[i]
    try {
      const payload = await fetchCatalog(profile.artist_id, token)
      if (payload) {
        await supabase
          .from('profiles')
          .update({ catalog_cache: payload, catalog_cached_at: new Date().toISOString() })
          .eq('id', profile.id)
      }
      processed++
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : 'unknown'
      errors.push(`${profile.artist_name ?? profile.artist_id}: ${msg}`)
      console.error('[cron/refresh-spotify-cache] failed:', profile.artist_id, msg)
      if (msg.startsWith('spotify_429')) break
    }

    if (i < list.length - 1) await sleep(500)
  }

  console.log(`[cron/refresh-spotify-cache] done — processed:${processed} failed:${failed}`)
  return NextResponse.json({ processed, failed, errors })
}
