import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SpotifyAlbum {
  name: string
  album_type: string
  release_date: string
  images: { url: string }[]
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) return null
  const { access_token, expires_in } = await res.json()
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

async function fetchCatalog(artistId: string) {
  const token = await getSpotifyToken()
  if (!token) return null

  let albums: SpotifyAlbum[] = []
  let url: string | null =
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10&market=US`

  while (url) {
    const res = await fetch(url, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) break
    const page: { items: SpotifyAlbum[]; next: string | null } = await res.json()
    albums = [...albums, ...page.items]
    url = page.next
  }

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

  return {
    total_releases: albums.length,
    latest_drop: { name: albums[0].name, date: albums[0].release_date },
    release_pace,
    recent_titles: last5.map(a => a.name),
  }
}

const SYSTEM_PROMPT = `You generate monthly artist growth reports for independent musicians.
Always respond with valid JSON only — no prose, no markdown fences, no explanation outside the JSON.
The JSON must have exactly these four keys: "month_in_review", "whats_working", "whats_to_fix", "next_30_days".
Each value is a string of 2-3 sentences. Be direct, specific, and strategic — write like a manager talking to their artist, not a hype man.`

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, genre, artist_id, tier')
    .eq('id', user.id)
    .single()

  if (!profile?.artist_id) {
    return NextResponse.json({ error: 'Connect your Spotify artist profile in Settings first.' }, { status: 400 })
  }

  const catalog = await fetchCatalog(profile.artist_id)
  if (!catalog) {
    return NextResponse.json({ error: 'Could not load your Spotify catalog.' }, { status: 502 })
  }

  const { total_releases, latest_drop, release_pace, recent_titles } = catalog
  const artistName = profile.artist_name ?? 'this artist'
  const genre = profile.genre ?? 'independent'
  const now = new Date()
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const userPrompt = [
    `Month: ${monthLabel}`,
    `Artist: ${artistName}`,
    `Genre: ${genre}`,
    `Total catalog: ${total_releases} releases`,
    `Latest drop: "${latest_drop.name}" (${latest_drop.date})`,
    release_pace != null ? `Release pace: every ${release_pace} week${release_pace === 1 ? '' : 's'}` : 'Release pace: not enough data',
    `Recent releases: ${recent_titles.join(', ')}`,
    '',
    'Generate the monthly growth report JSON.',
  ].join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  let report: {
    month_in_review: string
    whats_working: string
    whats_to_fix: string
    next_30_days: string
  }

  try {
    report = JSON.parse(raw)
  } catch {
    console.error('[reports/generate] Failed to parse AI response:', raw.slice(0, 200))
    return NextResponse.json({ error: 'Failed to generate report. Please try again.' }, { status: 500 })
  }

  if (profile.tier === 'free' || !profile.tier) {
    report.next_30_days =
      report.next_30_days + ' Upgrade to Artist for your full action plan.'
  }

  return NextResponse.json({ report })
}
