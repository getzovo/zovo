import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.tier ?? 'free'

  if (tier === 'free') {
    return NextResponse.json({ error: 'tier_locked' }, { status: 403 })
  }

  if (tier === 'artist') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('distributions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)

    if ((count ?? 0) >= 2) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { releaseTitle, artistName, releaseType, genre, releaseDate, upc, isrc, notes } = body

  if (!releaseTitle || !artistName || !releaseType || !genre || !releaseDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error: insertError } = await supabase
    .from('distributions')
    .insert({
      user_id: user.id,
      release_title: releaseTitle,
      artist_name: artistName,
      release_type: releaseType,
      genre,
      release_date: releaseDate,
      upc: upc || null,
      isrc: isrc || null,
      notes: notes || null,
      status: 'submitted',
    })

  if (insertError) {
    console.error('[distribution/submit] insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to submit release' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const emailBody = [
    `Release Title: ${releaseTitle}`,
    `Artist Name:   ${artistName}`,
    `Release Type:  ${releaseType}`,
    `Genre:         ${genre}`,
    `Release Date:  ${releaseDate}`,
    `UPC:           ${upc || '—'}`,
    `ISRC:          ${isrc || '—'}`,
    `Notes:         ${notes || '—'}`,
    '',
    `User ID: ${user.id}`,
  ].join('\n')

  const { error: sendError } = await resend.emails.send({
    from: 'pitches@getzovo.app',
    to: 'rob@getzovo.app',
    subject: `New Distribution Submission — ${releaseTitle}`,
    text: emailBody,
  })

  if (sendError) {
    console.error('[distribution/submit] resend error:', sendError)
  }

  return NextResponse.json({ success: true })
}
