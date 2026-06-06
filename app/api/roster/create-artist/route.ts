import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

function extractSpotifyId(input: string | null | undefined): string | null {
  if (!input) return null
  const m = input.match(/\/artist\/([a-zA-Z0-9]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim()
  return null
}

function inviteEmailHtml(managerName: string, artistName: string, claimUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>You've been added to a roster on Zovo</title></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding-bottom:48px;">
          <span style="font-size:28px;font-weight:900;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">
            ZOVO<span style="color:#FF4500;">.</span>
          </span>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:36px;font-weight:800;color:#F5F5F0;line-height:1.1;letter-spacing:-0.01em;">
            ${managerName} added you to their roster.
          </h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:16px;line-height:1.75;color:#888888;">
            ${managerName} has set up your Zovo profile for <strong style="color:#F5F5F0;">${artistName}</strong>. Claim your account to access your AI music career dashboard — pitch to curators, track your catalog, and plan your release runway.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:56px;">
          <a href="${claimUrl}" style="display:inline-block;background-color:#FF4500;color:#F5F5F0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:4px;">
            Claim Your Profile →
          </a>
        </td></tr>
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
            Zovo — Built for independent artists. San Francisco, CA.<br />
            <a href="https://getzovo.app" style="color:#444444;text-decoration:none;">getzovo.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: managerProfile } = await supabase
    .from('profiles')
    .select('artist_name, account_type')
    .eq('id', user.id)
    .single()

  if (managerProfile?.account_type !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { artist_name, genre, spotify_url, notes, email } = await request.json() as {
    artist_name: string
    genre?: string
    spotify_url?: string
    notes?: string
    email?: string
  }

  if (!artist_name?.trim()) {
    return NextResponse.json({ error: 'Artist name is required' }, { status: 400 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('roster_invites')
    .insert({
      manager_id: user.id,
      email: email?.trim() || null,
      status: 'pending',
      artist_name: artist_name.trim(),
      genre: genre?.trim() || null,
      spotify_url: extractSpotifyId(spotify_url) ? spotify_url?.trim() : null,
      notes: notes?.trim() || null,
    })
    .select('id, token, email')
    .single()

  if (inviteError || !invite) {
    console.error('[create-artist] insert error — code:', inviteError?.code, 'message:', inviteError?.message, 'details:', inviteError?.details, 'hint:', inviteError?.hint)
    return NextResponse.json({ error: 'Failed to create invite', detail: inviteError?.message }, { status: 500 })
  }

  if (email?.trim()) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const claimUrl = `https://getzovo.app/claim?token=${invite.token}`
    const managerName = managerProfile?.artist_name || 'Your manager'
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: invite.email,
      subject: `${managerName} added you to their roster on Zovo`,
      html: inviteEmailHtml(managerName, artist_name.trim(), claimUrl),
    }).catch(err => console.error('[create-artist] email send error:', err))
  }

  return NextResponse.json({ ok: true, invite_id: invite.id })
}
