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

  const { curatorId, curatorName, playlistName, curatorNotes, genreTags, releaseName, releaseType, releaseDate, artistNameOverride, artistId } = body

  if (!curatorName || !playlistName || !releaseName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, tier')
    .eq('id', user.id)
    .single()

  const artistName = (artistNameOverride as string | undefined)?.trim() || profile?.artist_name || 'the artist'

  if (profile?.tier === 'free' || !profile?.tier) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('pitches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'pitch_limit_reached', count: 3, limit: 3 }, { status: 403 })
    }
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
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const pitch = (message.content[0] as { type: string; text: string }).text.trim()

  const { data: saved, error: saveError } = await supabase
    .from('pitches')
    .insert({
      user_id: user.id,
      curator_id: curatorId ?? null,
      artist_id: artistId ?? null,
      release_name: releaseName,
      release_type: releaseType ?? null,
      pitch_body: pitch,
      status: 'draft',
    })
    .select('id')
    .single()

  if (saveError) console.error('[pitches/generate] save error:', saveError.message)

  return NextResponse.json({ pitch, pitchId: saved?.id ?? null })
}
