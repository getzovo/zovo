import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You write pitch emails from independent artists to playlist curators.
Write in the artist's voice — warm, direct, and genuine. Never sound like a PR agent or publicist.
Be specific: mention the curator's playlist by name and explain clearly why this particular release fits their sound and audience.
Keep it 150-200 words. Body only — no subject line, no sign-off, no placeholders.
Start mid-conversation, as if you already know them slightly. Be human.`

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { curatorName, playlistName, curatorNotes, genreTags, artistName, releaseName, releaseType, releaseDate } = body

  if (!curatorName || !playlistName || !artistName || !releaseName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userPrompt = [
    `Artist: ${artistName}`,
    `Release: "${releaseName}" (${releaseType ?? 'release'}, ${releaseDate ?? 'recent'})`,
    `Curator: ${curatorName}`,
    `Playlist: "${playlistName}"`,
    genreTags?.length ? `Playlist genres: ${genreTags.join(', ')}` : null,
    curatorNotes ? `Notes about this curator: ${curatorNotes}` : null,
    '',
    'Write the pitch email body.',
  ].filter(Boolean).join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const pitch = (message.content[0] as { type: string; text: string }).text.trim()
  return NextResponse.json({ pitch })
}
