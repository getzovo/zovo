import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

interface CatalogCache {
  total_releases: number; release_pace: number | null
  latest_drop: { name: string; date: string; type: string } | null
  recent_releases: { name: string; type: string; year: string; release_date: string; cover_art_url: string | null }[]
  full_catalog: { name: string; type: string; year: string; release_date: string; cover_art_url: string | null }[]
}

function calcHealthScore(
  cache: CatalogCache | null, hasSpotifyId: boolean, hasGenre: boolean,
  pitchCount: number, distCount: number,
) {
  const pace = cache?.release_pace
  const cadence = pace == null ? 0 : pace <= 8 ? 30 : pace <= 12 ? 20 : pace <= 20 ? 10 : 0
  const pitches = pitchCount >= 3 ? 25 : pitchCount === 2 ? 15 : pitchCount === 1 ? 8 : 0
  const n = cache?.total_releases ?? 0
  const catalog = n >= 10 ? 20 : n >= 5 ? 12 : n >= 1 ? 6 : 0
  const distribution = distCount >= 1 ? 15 : 0
  const profileScore = [hasSpotifyId, hasGenre].filter(Boolean).length === 2 ? 10 : [hasSpotifyId, hasGenre].filter(Boolean).length === 1 ? 5 : 0
  const score = cadence + pitches + catalog + distribution + profileScore
  return {
    score,
    breakdown: { cadence, pitches, catalog, distribution, profile: profileScore },
    status: (score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
  }
}

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: labelProfile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (labelProfile?.account_type !== 'label') {
    return NextResponse.json({ error: 'Label account required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const manager_id = searchParams.get('manager_id')
  if (!manager_id) return NextResponse.json({ error: 'manager_id required' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: managerProfile } = await adminClient
    .from('profiles')
    .select('label_id, artist_name')
    .eq('id', manager_id)
    .single()

  if (managerProfile?.label_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rosters } = await adminClient
    .from('rosters')
    .select('id, artist_id, status, joined_at')
    .eq('manager_id', manager_id)

  if (!rosters || rosters.length === 0) return NextResponse.json([])

  const artistIds = rosters.map(r => r.artist_id).filter(Boolean) as string[]

  const [{ data: profiles }, { data: pitches }, { data: dists }] = await Promise.all([
    adminClient.from('profiles').select('id, artist_name, genre, artist_id, catalog_cache, tier').in('id', artistIds),
    adminClient.from('pitches').select('user_id').in('user_id', artistIds).gte('created_at', thirtyDaysAgo),
    adminClient.from('distributions').select('user_id, created_at').in('user_id', artistIds),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const pitchCounts = new Map<string, number>()
  for (const p of pitches ?? []) pitchCounts.set(p.user_id, (pitchCounts.get(p.user_id) ?? 0) + 1)
  const distCountsAll = new Map<string, number>()
  const distCounts30d = new Map<string, number>()
  for (const d of dists ?? []) {
    distCountsAll.set(d.user_id, (distCountsAll.get(d.user_id) ?? 0) + 1)
    if ((d as { user_id: string; created_at: string }).created_at >= thirtyDaysAgo) {
      distCounts30d.set(d.user_id, (distCounts30d.get(d.user_id) ?? 0) + 1)
    }
  }

  return NextResponse.json(rosters.map(roster => {
    const prof = profileMap.get(roster.artist_id)
    const pitchCount = pitchCounts.get(roster.artist_id) ?? 0
    const distCount = distCountsAll.get(roster.artist_id) ?? 0
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
  }))
}
