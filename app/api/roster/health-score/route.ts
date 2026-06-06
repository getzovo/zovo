import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

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

function cadenceContext(pace: number | null): string {
  if (pace == null) return 'No release history yet'
  if (pace <= 8) return `Releasing every ${pace} weeks — strong cadence`
  if (pace <= 12) return `Releasing every ${pace} weeks — decent pace`
  if (pace <= 20) return `Releasing every ${pace} weeks — could be more consistent`
  return `Releasing every ${pace} weeks — slow cadence`
}

function pitchContext(count: number): string {
  if (count === 0) return '0 pitches in the last 30 days — start pitching'
  if (count === 1) return '1 pitch sent in the last 30 days'
  if (count === 2) return '2 pitches sent — building momentum'
  return `${count} pitches sent — actively pitching`
}

function catalogContext(n: number): string {
  if (n === 0) return 'No releases yet'
  if (n < 5) return `${n} release${n === 1 ? '' : 's'} — building your catalog`
  if (n < 10) return `${n} releases — solid catalog`
  return `${n} releases — healthy catalog size`
}

function distributionContext(count: number): string {
  if (count === 0) return 'No distribution submissions yet'
  return count === 1 ? '1 distribution submission' : `${count} distribution submissions`
}

function profileContext(hasSpotifyId: boolean, hasGenre: boolean): string {
  if (hasSpotifyId && hasGenre) return 'Profile fully set up'
  if (hasSpotifyId && !hasGenre) return 'Missing genre — add it to complete your profile'
  if (!hasSpotifyId && hasGenre) return 'Missing Spotify connection — link your artist profile'
  return 'Profile incomplete — add Spotify and genre'
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artist_id } = await request.json() as { artist_id: string }
  if (!artist_id) return NextResponse.json({ error: 'Missing artist_id' }, { status: 400 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: profile }, { count: pitchCount }, { count: distCount }] = await Promise.all([
    adminClient.from('profiles').select('artist_id, genre, catalog_cache').eq('id', artist_id).single(),
    adminClient.from('pitches').select('id', { count: 'exact', head: true }).eq('user_id', artist_id).gte('created_at', thirtyDaysAgo),
    adminClient.from('distributions').select('id', { count: 'exact', head: true }).eq('user_id', artist_id),
  ])

  const cache = profile?.catalog_cache as CatalogCache | null
  const hasSpotifyId = !!profile?.artist_id
  const hasGenre = !!profile?.genre
  const pc = pitchCount ?? 0
  const dc = distCount ?? 0

  const cadence = cadenceScore(cache)
  const pitches = pitchScore(pc)
  const catalog = catalogScore(cache)
  const distribution = dc >= 1 ? 15 : 0
  const profilePts = profileScore(hasSpotifyId, hasGenre)

  const score = cadence + pitches + catalog + distribution + profilePts
  const status: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'

  return NextResponse.json({
    score,
    breakdown: { cadence, pitches, catalog, distribution, profile: profilePts },
    status,
    context_strings: {
      cadence:      cadenceContext(cache?.release_pace ?? null),
      pitches:      pitchContext(pc),
      catalog:      catalogContext(cache?.total_releases ?? 0),
      distribution: distributionContext(dc),
      profile:      profileContext(hasSpotifyId, hasGenre),
    },
  })
}
