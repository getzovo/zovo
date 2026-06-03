import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const FREE_TIER_LIMIT = 3

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tier, artist_name').eq('id', user.id).single()

  // Enforce free tier pitch limit
  if (profile?.tier === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('pitches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= FREE_TIER_LIMIT) {
      return NextResponse.json({ error: 'Free tier pitch limit reached', limitReached: true }, { status: 403 })
    }
  }

  const { artist_name, release_name, release_type, release_year, curator_name, playlist_name, genre, notes } = await request.json()

  const systemPrompt = `You are writing a pitch email from ${artist_name || 'an independent artist'} to a playlist curator. Write a concise, professional, personalized pitch email (150-200 words). Do not use generic language. Reference the playlist specifically. Do not include a subject line. Start with "Hi ${curator_name},"`

  const userPrompt = `Artist: ${artist_name}
Release: ${release_name} (${release_type || 'single'}, ${release_year || new Date().getFullYear()})
Curator: ${curator_name}
Playlist: ${playlist_name}
Genre: ${genre}
What they look for: ${notes || 'Quality music that fits the playlist'}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const pitchBody = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ pitch_body: pitchBody })
}
