import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You generate monthly artist growth reports for independent musicians.
Always respond with valid JSON only — no prose, no markdown fences, no explanation outside the JSON.
The JSON must have exactly these four keys: "month_in_review", "whats_working", "whats_to_fix", "next_30_days".
Each value is a string of 2-3 sentences. Be direct, specific, and strategic — write like a manager talking to their artist, not a hype man.`

export async function POST(request: Request) {
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

  const cookieHeader = request.headers.get('cookie') ?? ''
  const statsRes = await fetch('https://getzovo.app/api/spotify/artist-stats', {
    headers: { cookie: cookieHeader },
  })
  if (!statsRes.ok) {
    return NextResponse.json({ error: 'Could not load your Spotify catalog.' }, { status: 502 })
  }
  const stats = await statsRes.json()
  if (!stats.total_releases) {
    return NextResponse.json({ error: 'Could not load your Spotify catalog.' }, { status: 502 })
  }

  const total_releases: number = stats.total_releases
  const latest_drop: { name: string; date: string } = stats.latest_drop
  const release_pace: number | null = stats.release_pace
  const recent_titles: string[] = (stats.recent_releases ?? []).map((r: { name: string }) => r.name)
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
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  // Strip markdown code fences if the model wrapped its response
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  const toParse = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw

  let report: {
    month_in_review: string
    whats_working: string
    whats_to_fix: string
    next_30_days: string
  }

  try {
    report = JSON.parse(toParse)
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
