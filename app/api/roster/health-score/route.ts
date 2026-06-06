import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CatalogCache {
  total_releases: number
  release_pace: number | null
}

function cadenceScore(cache: CatalogCache | null): number {
  const p = cache?.release_pace
  if (p == null) return 0
  if (p <= 8) return 30
  if (p <= 12) return 20
  if (p <= 20) return 10
  return 0
}

function pitchScore(count: number): number {
  if (count >= 3) return 25
  if (count === 2) return 15
  if (count === 1) return 8
  return 0
}

function catalogScore(cache: CatalogCache | null): number {
  const n = cache?.total_releases ?? 0
  if (n >= 10) return 20
  if (n >= 5) return 12
  if (n >= 1) return 6
  return 0
}

function profileScore(hasSpotifyId: boolean, hasGenre: boolean): number {
  const n = [hasSpotifyId, hasGenre].filter(Boolean).length
  if (n === 2) return 10
  if (n === 1) return 5
  return 0
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artist_id } = await request.json() as { artist_id: string }
  if (!artist_id) return NextResponse.json({ error: 'Missing artist_id' }, { status: 400 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: profile }, { count: pitchCount }, { count: distCount }] = await Promise.all([
    supabase.from('profiles').select('artist_id, genre, catalog_cache').eq('id', artist_id).single(),
    supabase.from('pitches').select('id', { count: 'exact', head: true }).eq('user_id', artist_id).gte('created_at', thirtyDaysAgo),
    supabase.from('distributions').select('id', { count: 'exact', head: true }).eq('user_id', artist_id),
  ])

  const cache = profile?.catalog_cache as CatalogCache | null

  const cadence = cadenceScore(cache)
  const pitches = pitchScore(pitchCount ?? 0)
  const catalog = catalogScore(cache)
  const distribution = (distCount ?? 0) >= 1 ? 15 : 0
  const profilePts = profileScore(!!profile?.artist_id, !!profile?.genre)

  const score = cadence + pitches + catalog + distribution + profilePts
  const status: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'

  return NextResponse.json({
    score,
    breakdown: { cadence, pitches, catalog, distribution, profile: profilePts },
    status,
  })
}
