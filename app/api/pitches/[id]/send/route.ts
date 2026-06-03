import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pitch } = await supabase
    .from('pitches')
    .select('*, curator:curators(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!pitch) return NextResponse.json({ error: 'Pitch not found' }, { status: 404 })

  const curator = pitch.curator
  if (!curator?.submission_email) return NextResponse.json({ error: 'No submission email' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('artist_name').eq('id', user.id).single()

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: curator.submission_email,
    subject: `Music submission: ${pitch.release_name} by ${profile?.artist_name || 'Independent Artist'}`,
    text: pitch.pitch_body,
    replyTo: user.email || undefined,
  })

  if (sendError) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })

  await supabase.from('pitches').update({ status: 'sent' }).eq('id', params.id)

  return NextResponse.json({ ok: true })
}
