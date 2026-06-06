import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

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
    .select('id, user_id, artist_id, release_name, pitch_body')
    .eq('id', pitchId)
    .single()

  if (pitchError || !pitch) {
    return NextResponse.json({ error: 'Pitch not found' }, { status: 404 })
  }
  if (pitch.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: curator }, curatorNameResult] = await Promise.all([
    supabase.from('curators').select('submission_email, name, playlist_name').eq('id', curatorId).single(),
    supabase.from('curators').select('name, playlist_name').eq('id', curatorId).single(),
  ])

  if (!curator?.submission_email) {
    return NextResponse.json({ error: 'Curator submission email not found' }, { status: 404 })
  }

  const { error: sendError } = await resend.emails.send({
    from: 'Zovo <notifications@mail.getzovo.app>',
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

  // Notify the linked artist if this is a manager-submitted pitch
  if (pitch.artist_id) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data: artistAuth } = await adminClient.auth.admin.getUserById(pitch.artist_id)
      const artistEmail = artistAuth?.user?.email

      const curatorName = curatorNameResult.data?.name ?? 'a curator'
      const playlistName = curatorNameResult.data?.playlist_name ?? 'their playlist'

      if (artistEmail) {
        await resend.emails.send({
          from: 'Zovo <notifications@mail.getzovo.app>',
          to: artistEmail,
          subject: `Your manager pitched you to ${curatorName}`,
          html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td style="padding-bottom:40px;">
          <span style="font-size:24px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">ZOVO<span style="color:#FF4500;">.</span></span>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <h1 style="margin:0;font-size:34px;font-weight:800;color:#F5F5F0;line-height:1.15;">Your manager pitched you to ${curatorName}.</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:15px;line-height:1.75;color:#888888;">
            <strong style="color:#F5F5F0;">${pitch.release_name}</strong> was pitched to
            <strong style="color:#F5F5F0;">${curatorName}</strong> for inclusion in
            <strong style="color:#F5F5F0;">${playlistName}</strong>.
            Head to your dashboard to view the pitch and leave feedback for your manager.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:48px;">
          <a href="https://getzovo.app/dashboard/pitching"
             style="display:inline-block;background-color:#FF4500;color:#F5F5F0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:4px;">
            View pitch &amp; leave feedback →
          </a>
        </td></tr>
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:28px;">
          <p style="margin:0;font-size:11px;color:#444444;line-height:1.6;">
            Zovo — Built for independent artists.<br />
            <a href="https://getzovo.app" style="color:#444444;text-decoration:none;">getzovo.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
      }
    } catch (notifyErr) {
      // Non-fatal — log and continue
      console.error('[pitches/send] artist notify error:', notifyErr)
    }
  }

  return NextResponse.json({ success: true })
}
