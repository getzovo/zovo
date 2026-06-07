import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json() as { email: string }
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()
  if (profile?.account_type !== 'label') {
    return NextResponse.json({ error: 'Label account required' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: label } = await adminClient
    .from('labels')
    .select('id, name')
    .eq('owner_user_id', user.id)
    .single()
  if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 })

  const { data: invite, error: insertError } = await adminClient
    .from('label_invites')
    .insert({ label_id: label.id, email: email.trim() })
    .select('token')
    .single()
  if (insertError || !invite) {
    console.error('[label/invite] insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const acceptUrl = `https://getzovo.app/invite/${invite.token}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>You've been invited to join ${label.name} on Zovo</title></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding-bottom:48px;">
          <span style="font-size:28px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">ZOVO<span style="color:#FF4500;">.</span></span>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:36px;font-weight:800;color:#F5F5F0;line-height:1.1;">You've been invited to join ${label.name}.</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:16px;line-height:1.75;color:#888888;">${label.name} has invited you to manage their roster on Zovo — the music career platform built for independent artists and their teams.</p>
        </td></tr>
        <tr><td style="padding-bottom:56px;">
          <a href="${acceptUrl}" style="display:inline-block;background-color:#FF4500;color:#F5F5F0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:4px;">Accept Invite →</a>
        </td></tr>
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#444444;">Zovo — Built for independent artists and their teams. <a href="https://getzovo.app" style="color:#444444;text-decoration:none;">getzovo.app</a></p>
          <p style="margin:8px 0 0;font-size:12px;color:#444444;">If you didn't expect this invite, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email.trim(),
    subject: `You've been invited to join ${label.name} on Zovo`,
    html,
  })

  if (emailError) {
    console.error('[label/invite] email error:', emailError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
