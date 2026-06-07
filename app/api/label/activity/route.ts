import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export interface ActivityItem {
  pitch_id: string
  artist_name: string
  curator_name: string
  playlist_name: string
  manager_name: string
  status: string
  created_at: string
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
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

  const db = admin()

  const { data: labelRow } = await db
    .from('labels')
    .select('id')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Collect manager IDs from all sources
  const managerIdSet = new Set<string>()

  if (labelRow?.id) {
    const [{ data: links }, { data: acceptedInvites }] = await Promise.all([
      db.from('label_managers').select('manager_user_id').eq('label_id', labelRow.id).not('accepted_at', 'is', null),
      db.from('label_invites').select('email').eq('label_id', labelRow.id).eq('status', 'accepted'),
    ])
    for (const l of links ?? []) managerIdSet.add(l.manager_user_id)

    // For accepted invites, look up manager profile by auth email via auth admin
    if (acceptedInvites && acceptedInvites.length > 0) {
      const emails = new Set(acceptedInvites.map(inv => inv.email))
      const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
      for (const u of users) {
        if (u.email && emails.has(u.email)) managerIdSet.add(u.id)
      }
    }
  }

  // Fallback: managers from profiles.label_id (pre-fix acceptances)
  const { data: profileManagers } = await db
    .from('profiles')
    .select('id')
    .eq('label_id', user.id)
    .eq('account_type', 'manager')
  for (const m of profileManagers ?? []) managerIdSet.add(m.id)

  const managerIds = Array.from(managerIdSet)
  if (managerIds.length === 0) {
    return NextResponse.json({ activity: [] })
  }

  // Get active rosters for all managers
  const { data: rosters } = await db
    .from('rosters')
    .select('manager_id, artist_id')
    .in('manager_id', managerIds)
    .eq('status', 'active')

  const artistIds = Array.from(new Set((rosters ?? []).map(r => r.artist_id).filter(Boolean) as string[]))
  if (artistIds.length === 0) {
    return NextResponse.json({ activity: [] })
  }

  // Fetch pitches, artist profiles, manager profiles, curators in parallel
  const [{ data: pitches }, { data: artistProfiles }, { data: managerProfiles }] = await Promise.all([
    db.from('pitches')
      .select('id, user_id, curator_id, status, created_at')
      .in('user_id', artistIds)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('profiles').select('id, artist_name').in('id', artistIds),
    db.from('profiles').select('id, artist_name').in('id', managerIds),
  ])

  if (!pitches || pitches.length === 0) {
    return NextResponse.json({ activity: [] })
  }

  const curatorIds = Array.from(new Set(pitches.map(p => p.curator_id).filter(Boolean) as string[]))
  const { data: curators } = await db
    .from('curators')
    .select('id, name, playlist_name')
    .in('id', curatorIds)

  // Build lookup maps
  const artistMap = new Map((artistProfiles ?? []).map(p => [p.id, p.artist_name ?? 'Unknown Artist']))
  const managerMap = new Map((managerProfiles ?? []).map(p => [p.id, p.artist_name ?? 'Unknown Manager']))
  const curatorMap = new Map((curators ?? []).map(c => [c.id, c]))

  // artist -> manager lookup
  const artistToManager = new Map<string, string>()
  for (const r of rosters ?? []) {
    if (r.artist_id && !artistToManager.has(r.artist_id)) {
      artistToManager.set(r.artist_id, r.manager_id)
    }
  }

  const activity: ActivityItem[] = pitches.map(pitch => {
    const managerId = artistToManager.get(pitch.user_id) ?? ''
    const curator = curatorMap.get(pitch.curator_id ?? '')
    return {
      pitch_id: pitch.id,
      artist_name: artistMap.get(pitch.user_id) ?? 'Unknown Artist',
      curator_name: curator?.name ?? 'Unknown Curator',
      playlist_name: curator?.playlist_name ?? '',
      manager_name: managerMap.get(managerId) ?? 'Unknown Manager',
      status: pitch.status ?? 'draft',
      created_at: pitch.created_at,
    }
  })

  return NextResponse.json({ activity })
}
