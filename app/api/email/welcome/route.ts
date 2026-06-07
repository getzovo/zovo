import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Zovo</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:48px;">
              <span style="font-size:28px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">
                ZOVO<span style="color:#FF4500;">.</span>
              </span>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:42px;font-weight:800;color:#F5F5F0;line-height:1.1;letter-spacing:-0.01em;">
                Welcome to Zovo.
              </h1>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding-bottom:40px;">
              <p style="margin:0;font-size:16px;line-height:1.75;color:#888888;">
                You're now part of an early group of independent artists using AI to run their music career. Here's what to do first:
              </p>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${[
                  ['01', 'Connect your Spotify account in Settings'],
                  ['02', 'Run your first AI pitch'],
                  ['03', 'Check your catalog intelligence on the dashboard'],
                ].map(([n, text]) => `
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #1a1a1a;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="font-size:11px;font-family:'Courier New',monospace;color:#FF4500;letter-spacing:0.1em;vertical-align:top;padding-top:2px;">${n}</td>
                        <td style="font-size:15px;color:#F5F5F0;line-height:1.5;">${text}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:56px;">
              <a href="https://getzovo.app/dashboard"
                 style="display:inline-block;background-color:#FF4500;color:#F5F5F0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:4px;">
                Go to your dashboard →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid #1a1a1a;padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                Zovo — Built for independent artists. San Francisco, CA.<br />
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

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email,
    subject: "You're in. Welcome to Zovo.",
    html,
  })

  if (error) {
    console.error('Resend welcome email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
