import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  console.log('[send-verification] route hit')
  const { email, userId, type = 'signup' } = await req.json()
  console.log('[send-verification] email:', email, 'userId:', userId, 'hasResendKey:', !!process.env.RESEND_API_KEY)
  if (!email || !userId) {
    console.log('[send-verification] missing email or userId')
    return NextResponse.json({ error: 'email and userId required' }, { status: 400 })
  }

  const admin = adminClient()

  await admin
    .from('verification_codes')
    .update({ used: true })
    .eq('email', email)
    .eq('type', type)
    .eq('used', false)

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error: insertError } = await admin
    .from('verification_codes')
    .insert({ email, code, type, user_id: userId, expires_at })

  if (insertError) {
    console.error('[send-verification] insert error:', JSON.stringify(insertError))
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 })
  }
  console.log('[send-verification] code inserted ok')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Zovo verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

          <tr>
            <td style="padding-bottom:48px;">
              <span style="font-size:28px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">
                ZOVO<span style="color:#FF4500;">.</span>
              </span>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#F5F5F0;line-height:1.2;">
                Your verification code
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:15px;color:#888888;line-height:1.6;">
                Enter this code on the Zovo verification page to confirm your account.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 0;background-color:#111111;border-radius:8px;text-align:center;">
              <span style="font-size:52px;font-weight:800;color:#FF4500;letter-spacing:0.25em;font-family:'Courier New',monospace;">
                ${code}
              </span>
            </td>
          </tr>

          <tr><td style="height:32px;"></td></tr>

          <tr>
            <td style="border-top:1px solid #1a1a1a;padding-top:24px;">
              <p style="margin:0;font-size:13px;color:#444444;line-height:1.6;">
                This code expires in 60 minutes. If you didn&apos;t request this, you can safely ignore this email.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#333333;">
                Zovo &middot; San Francisco, CA &middot;
                <a href="https://getzovo.app" style="color:#444444;text-decoration:none;">getzovo.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: 'notifications@getzovo.app',
    to: email,
    subject: 'Your Zovo verification code',
    html,
  })

  if (emailError) {
    console.error('[send-verification] Resend error:', JSON.stringify(emailError))
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
  console.log('[send-verification] email sent ok')

  return NextResponse.json({ ok: true })
}
