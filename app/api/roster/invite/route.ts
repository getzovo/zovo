import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invite_id, email } = await request.json() as { invite_id: string; email: string }
  if (!invite_id || !email?.trim()) {
    return NextResponse.json({ error: 'invite_id and email are required' }, { status: 400 })
  }

  const { data: invite, error } = await supabase
    .from('roster_invites')
    .select('id, token, artist_name, email, manager_id, status')
    .eq('id', invite_id)
    .eq('manager_id', user.id)
    .single()

  if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Already claimed' }, { status: 409 })

  if (email.trim() !== invite.email) {
    await supabase
      .from('roster_invites')
      .update({ email: email.trim() })
      .eq('id', invite_id)
  }

  const { data: managerProfile } = await supabase
    .from('profiles')
    .select('artist_name')
    .eq('id', user.id)
    .single()

  const resend = new Resend(process.env.RESEND_API_KEY)
  const claimUrl = `https://getzovo.app/claim?token=${invite.token}`
  const managerName = managerProfile?.artist_name || 'Your manager'
  const artistName = invite.artist_name || 'your profile'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>You've been added to a roster on Zovo</title></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding-bottom:48px;">
          <span style="font-size:28px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">ZOVO<span style="color:#FF4500;">.</span></span>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:36px;font-weight:800;color:#F5F5F0;line-height:1.1;">${managerName} added you to their roster.</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:16px;line-height:1.75;color:#888888;">${managerName} has set up your Zovo profile for <strong style="color:#F5F5F0;">${artistName}</strong>. Claim your account to get access to your AI music career dashboard.</p>
        </td></tr>
        <tr><td style="padding-bottom:56px;">
          <a href="${claimUrl}" style="display:inline-block;background-color:#FF4500;color:#F5F5F0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:4px;">Claim Your Profile →</a>
        </td></tr>
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#444444;">Zovo — Built for independent artists. <a href="https://getzovo.app" style="color:#444444;text-decoration:none;">getzovo.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email.trim(),
    subject: `${managerName} added you to their roster on Zovo`,
    html,
  })

  if (emailError) {
    console.error('[roster/invite] email error:', emailError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
