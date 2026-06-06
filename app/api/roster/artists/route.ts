import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

interface CatalogCache {
  total_releases: number
  release_pace: number | null
}

function calcHealthScore(
  cache: CatalogCache | null,
  hasSpotifyId: boolean,
  hasGenre: boolean,
  pitchCount: number,
  distCount: number,
) {
  const pace = cache?.release_pace
  const cadence = pace == null ? 0 : pace <= 8 ? 30 : pace <= 12 ? 20 : pace <= 20 ? 10 : 0
  const pitches = pitchCount >= 3 ? 25 : pitchCount === 2 ? 15 : pitchCount === 1 ? 8 : 0
  const n = cache?.total_releases ?? 0
  const catalog = n >= 10 ? 20 : n >= 5 ? 12 : n >= 1 ? 6 : 0
  const distribution = distCount >= 1 ? 15 : 0
  const completed = [hasSpotifyId, hasGenre].filter(Boolean).length
  const profile = completed === 2 ? 10 : completed === 1 ? 5 : 0
  const score = cadence + pitches + catalog + distribution + profile
  return {
    score,
    breakdown: { cadence, pitches, catalog, distribution, profile },
    status: (score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
  }
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: rosters }, { data: pendingInvites }] = await Promise.all([
    supabase.from('rosters').select('id, artist_id, status, joined_at').eq('manager_id', user.id),
    supabase.from('roster_invites')
      .select('id, artist_name, genre, email, status, spotify_url')
      .eq('manager_id', user.id)
      .eq('status', 'pending'),
  ])

  const claimedResults = await (async () => {
    if (!rosters || rosters.length === 0) return []

    const ids = rosters.map(r => r.artist_id).filter(Boolean) as string[]

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const [{ data: profiles }, { data: pitchRows }, { data: distRows }] = await Promise.all([
      adminClient.from('profiles').select('id, artist_name, genre, artist_id, catalog_cache, catalog_cached_at, tier').in('id', ids),
      supabase.from('pitches').select('user_id').in('user_id', ids).gte('created_at', thirtyDaysAgo),
      supabase.from('distributions').select('user_id, created_at').in('user_id', ids),
    ])

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

    const pitchCounts = new Map<string, number>()
    for (const p of pitchRows ?? []) {
      pitchCounts.set(p.user_id, (pitchCounts.get(p.user_id) ?? 0) + 1)
    }

    const distCounts = new Map<string, number>()
    const distCounts30d = new Map<string, number>()
    for (const d of distRows ?? []) {
      distCounts.set(d.user_id, (distCounts.get(d.user_id) ?? 0) + 1)
      if (d.created_at >= thirtyDaysAgo) {
        distCounts30d.set(d.user_id, (distCounts30d.get(d.user_id) ?? 0) + 1)
      }
    }

    return rosters.map(roster => {
      const prof = profileMap.get(roster.artist_id)
      const pitchCount = pitchCounts.get(roster.artist_id) ?? 0
      const distCount = distCounts.get(roster.artist_id) ?? 0
      const cache = prof?.catalog_cache as CatalogCache | null

      return {
        claimed: true,
        profile: prof ?? null,
        health_score: calcHealthScore(cache, !!prof?.artist_id, !!prof?.genre, pitchCount, distCount),
        roster_status: roster.status,
        roster_id: roster.id,
        invite_id: null,
        joined_at: roster.joined_at,
        pitch_count_30d: pitchCount,
        dist_count_30d: distCounts30d.get(roster.artist_id) ?? 0,
        artist_name_override: null,
        genre_override: null,
        claim_email: null,
      }
    })
  })()

  const pendingResults = (pendingInvites ?? []).map(inv => ({
    claimed: false,
    profile: null,
    health_score: { score: 0, breakdown: { cadence: 0, pitches: 0, catalog: 0, distribution: 0, profile: 0 }, status: 'red' as const },
    roster_status: 'pending',
    roster_id: inv.id,
    invite_id: inv.id,
    joined_at: null,
    pitch_count_30d: 0,
    dist_count_30d: 0,
    artist_name_override: inv.artist_name ?? null,
    genre_override: inv.genre ?? null,
    claim_email: inv.email ?? null,
  }))

  return NextResponse.json([...claimedResults, ...pendingResults])
}
