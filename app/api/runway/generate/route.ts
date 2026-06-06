import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { releases, tier } = await request.json()

  if (tier === 'free' || !tier) {
    return NextResponse.json({ gated: true })
  }

  const sorted: Array<{ name: string; release_date: string }> = [...(releases ?? [])]
    .filter(r => r.release_date)
    .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())

  if (sorted.length === 0) {
    return NextResponse.json({ error: 'No release data available.' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const releaseList = sorted
    .map(r => `- "${r.name}" (${r.release_date})`)
    .join('\n')

  const userPrompt = [
    `Today's date: ${today}`,
    `Release history (chronological):`,
    releaseList,
    '',
    'Analyze this artist\'s release cadence and respond with valid JSON only — no markdown fences, no prose outside the JSON.',
    'The JSON must have exactly these four keys:',
    '  "recommendation" — 2-3 sentences of plain-English strategy for when to drop next and why',
    '  "window_start" — ISO date string (YYYY-MM-DD) for the start of the recommended drop window',
    '  "window_end" — ISO date string (YYYY-MM-DD), 7 days after window_start',
    '  "cadence_weeks" — integer, the average cadence between releases in whole weeks',
  ].join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `You are a music career strategist. Given an artist's release history, identify their average release cadence and recommend the ideal next drop window. Base the window on maintaining or slightly improving their cadence. Be specific with dates. Always respond with valid JSON only — no markdown fences, no explanation outside the JSON object.`,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  const toParse = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw

  let result: {
    recommendation: string
    window_start: string
    window_end: string
    cadence_weeks: number
  }

  try {
    result = JSON.parse(toParse)
  } catch {
    return NextResponse.json({ error: 'Failed to generate recommendation. Please try again.' }, { status: 500 })
  }

  return NextResponse.json(result)
}
