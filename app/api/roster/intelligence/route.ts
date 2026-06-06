import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a senior music industry analyst writing a weekly roster brief for a music manager.
Write in a direct, strategic tone — like a seasoned industry professional, not a hype writer.
Structure your response with these exact section headers (all caps, on their own line):

ROSTER HEALTH SUMMARY
ARTISTS ON PACE
ARTISTS FALLING BEHIND
RELEASE CONFLICTS & GAPS
PITCH ACTIVITY ANALYSIS
TOP 3 ACTIONS THIS WEEK

Each section should be 2-4 sentences of specific, data-driven analysis.
Use actual artist names and data. Be direct and actionable.
Do not use markdown formatting, asterisks, or bullet points — write in clean prose paragraphs under each header.`

interface CatalogCache {
  total_releases?: number
  release_pace?: number | null
  latest_drop?: { name: string; date: string } | null
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.account_type !== 'manager' && profile.account_type !== 'label')) {
    return NextResponse.json({ error: 'Manager or label account required' }, { status: 403 })
  }

  const body = await request.json() as { manager_id?: string }
  const manager_id = body.manager_id ?? (profile.account_type === 'manager' ? user.id : null)

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  let artistIds: string[] = []

  if (profile.account_type === 'label' && !manager_id) {
    // Aggregate all artists across all label managers
    const { data: managers } = await adminClient
      .from('profiles')
      .select('id')
      .eq('label_id', user.id)
      .eq('account_type', 'manager')

    const managerIds = (managers ?? []).map(m => m.id)
    if (managerIds.length === 0) {
      return NextResponse.json({ error: 'No managers linked to this label.' }, { status: 400 })
    }
    const { data: rosters } = await adminClient
      .from('rosters')
      .select('artist_id')
      .in('manager_id', managerIds)
      .eq('status', 'active')
    artistIds = Array.from(new Set((rosters ?? []).map(r => r.artist_id).filter(Boolean) as string[]))
  } else if (manager_id) {
    const { data: rosters } = await adminClient
      .from('rosters')
      .select('artist_id')
      .eq('manager_id', manager_id)
      .eq('status', 'active')
    artistIds = (rosters ?? []).map(r => r.artist_id).filter(Boolean) as string[]
  }

  if (artistIds.length === 0) {
    return NextResponse.json({ error: 'No artists on roster.' }, { status: 400 })
  }

  const [{ data: profiles }, { data: pitches }, { data: distributions }] = await Promise.all([
    adminClient.from('profiles').select('id, artist_name, genre, artist_id, catalog_cache').in('id', artistIds),
    adminClient.from('pitches').select('user_id, status').in('user_id', artistIds).gte('created_at', thirtyDaysAgo),
    adminClient.from('distributions').select('user_id').in('user_id', artistIds),
  ])

  const pitchCounts = new Map<string, number>()
  for (const p of pitches ?? []) {
    pitchCounts.set(p.user_id, (pitchCounts.get(p.user_id) ?? 0) + 1)
  }
  const distCounts = new Map<string, number>()
  for (const d of distributions ?? []) {
    distCounts.set(d.user_id, (distCounts.get(d.user_id) ?? 0) + 1)
  }

  const artistSummaries = (profiles ?? []).map(p => {
    const cache = p.catalog_cache as CatalogCache | null
    return [
      `Artist: ${p.artist_name ?? 'Unknown'}`,
      `  Genre: ${p.genre ?? 'Unknown'}`,
      `  Total releases: ${cache?.total_releases ?? 0}`,
      `  Release pace: ${cache?.release_pace != null ? `every ${cache.release_pace} weeks` : 'unknown'}`,
      `  Latest drop: ${cache?.latest_drop ? `"${cache.latest_drop.name}" on ${cache.latest_drop.date}` : 'none'}`,
      `  Pitches last 30 days: ${pitchCounts.get(p.id) ?? 0}`,
      `  Distribution submissions total: ${distCounts.get(p.id) ?? 0}`,
    ].join('\n')
  }).join('\n\n')

  const userPrompt = `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Roster size: ${profiles?.length ?? 0} artists

ARTIST DATA:
${artistSummaries}

Write the weekly roster brief.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const brief = (message.content[0] as { type: string; text: string }).text.trim()

  return NextResponse.json({ brief, generated_at: new Date().toISOString() })
}
