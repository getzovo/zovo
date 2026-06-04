import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { pitchId, curatorId } = body
  if (!pitchId || !curatorId) {
    return NextResponse.json({ error: 'Missing pitchId or curatorId' }, { status: 400 })
  }

  const { data: pitch, error: pitchError } = await supabase
    .from('pitches')
    .select('id, user_id, release_name, pitch_body')
    .eq('id', pitchId)
    .single()

  if (pitchError || !pitch) {
    return NextResponse.json({ error: 'Pitch not found' }, { status: 404 })
  }
  if (pitch.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: curator, error: curatorError } = await supabase
    .from('curators')
    .select('submission_email')
    .eq('id', curatorId)
    .single()

  if (curatorError || !curator?.submission_email) {
    return NextResponse.json({ error: 'Curator submission email not found' }, { status: 404 })
  }

  const { error: sendError } = await resend.emails.send({
    from: 'pitches@getzovo.app',
    to: curator.submission_email,
    subject: `[pitch] ${pitch.release_name}`,
    text: pitch.pitch_body,
  })

  if (sendError) {
    console.error('[pitches/send] resend error:', sendError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('pitches')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', pitchId)

  if (updateError) {
    console.error('[pitches/send] update error:', updateError.message)
  }

  return NextResponse.json({ success: true })
}
