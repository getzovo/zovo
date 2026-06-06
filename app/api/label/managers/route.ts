import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

interface CatalogCache { total_releases: number; release_pace: number | null }

function calcHealthScore(
  cache: CatalogCache | null,
  hasSpotifyId: boolean,
  hasGenre: boolean,
  pitchCount: number,
  distCount: number,
): number {
  const pace = cache?.release_pace
  const cadence = pace == null ? 0 : pace <= 8 ? 30 : pace <= 12 ? 20 : pace <= 20 ? 10 : 0
  const pitches = pitchCount >= 3 ? 25 : pitchCount === 2 ? 15 : pitchCount === 1 ? 8 : 0
  const n = cache?.total_releases ?? 0
  const catalog = n >= 10 ? 20 : n >= 5 ? 12 : n >= 1 ? 6 : 0
  const distribution = distCount >= 1 ? 15 : 0
  const profileScore = [hasSpotifyId, hasGenre].filter(Boolean).length === 2 ? 10 : [hasSpotifyId, hasGenre].filter(Boolean).length === 1 ? 5 : 0
  return cadence + pitches + catalog + distribution + profileScore
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: labelProfile } = await supabase
    .from('profiles')
    .select('account_type, artist_name')
    .eq('id', user.id)
    .single()

  if (labelProfile?.account_type !== 'label') {
    return NextResponse.json({ error: 'Label account required' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: managers } = await adminClient
    .from('profiles')
    .select('id, artist_name, created_at')
    .eq('label_id', user.id)
    .eq('account_type', 'manager')

  const labelName = labelProfile?.artist_name ?? 'Your Label'

  if (!managers || managers.length === 0) {
    return NextResponse.json({
      managers: [],
      label_name: labelName,
      stats: { total_managers: 0, total_artists: 0, avg_health: 0, active_this_month: 0 },
    })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const managerIds = managers.map(m => m.id)

  const { data: allRosters } = await adminClient
    .from('rosters')
    .select('id, manager_id, artist_id, joined_at, status')
    .in('manager_id', managerIds)
    .eq('status', 'active')

  const artistIds = Array.from(new Set((allRosters ?? []).map(r => r.artist_id).filter(Boolean) as string[]))

  const [{ data: artistProfiles }, { data: pitches }, { data: dists }] = await Promise.all([
    artistIds.length > 0
      ? adminClient.from('profiles').select('id, artist_id, genre, catalog_cache').in('id', artistIds)
      : Promise.resolve({ data: [] as { id: string; artist_id: string | null; genre: string | null; catalog_cache: unknown }[] }),
    artistIds.length > 0
      ? adminClient.from('pitches').select('user_id').in('user_id', artistIds).gte('created_at', thirtyDaysAgo)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    artistIds.length > 0
      ? adminClient.from('distributions').select('user_id').in('user_id', artistIds)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
  ])

  const profileMap = new Map((artistProfiles ?? []).map(p => [p.id, p]))
  const pitchCounts = new Map<string, number>()
  for (const p of pitches ?? []) pitchCounts.set(p.user_id, (pitchCounts.get(p.user_id) ?? 0) + 1)
  const distCounts = new Map<string, number>()
  for (const d of dists ?? []) distCounts.set(d.user_id, (distCounts.get(d.user_id) ?? 0) + 1)
  const activeArtists = new Set((pitches ?? []).map(p => p.user_id))

  const managerCards = managers.map(m => {
    const managerRosters = (allRosters ?? []).filter(r => r.manager_id === m.id)
    const managerArtistIds = managerRosters.map(r => r.artist_id).filter(Boolean) as string[]

    let totalHealth = 0; let healthCount = 0
    for (const aid of managerArtistIds) {
      const p = profileMap.get(aid)
      if (p) {
        totalHealth += calcHealthScore(
          p.catalog_cache as CatalogCache | null,
          !!(p as { artist_id?: string | null }).artist_id,
          !!(p as { genre?: string | null }).genre,
          pitchCounts.get(aid) ?? 0,
          distCounts.get(aid) ?? 0,
        )
        healthCount++
      }
    }

    const lastActive = managerRosters
      .filter(r => r.joined_at)
      .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())[0]?.joined_at ?? m.created_at

    return {
      id: m.id,
      name: m.artist_name ?? 'Unknown Manager',
      roster_count: managerArtistIds.length,
      avg_health: healthCount > 0 ? Math.round(totalHealth / healthCount) : 0,
      last_active: lastActive,
    }
  })

  const totalActive = artistIds.filter(id => activeArtists.has(id)).length
  const healthScores = managerCards.filter(m => m.avg_health > 0).map(m => m.avg_health)
  const avgHealth = healthScores.length > 0 ? Math.round(healthScores.reduce((s, h) => s + h, 0) / healthScores.length) : 0

  return NextResponse.json({
    managers: managerCards,
    label_name: labelName,
    stats: {
      total_managers: managers.length,
      total_artists: artistIds.length,
      avg_health: avgHealth,
      active_this_month: totalActive,
    },
  })
}
