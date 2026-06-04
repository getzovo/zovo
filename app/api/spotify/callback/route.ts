import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const settingsUrl = new URL('/dashboard/settings', request.url)

  if (error || !code) {
    settingsUrl.searchParams.set('spotify_error', '1')
    return NextResponse.redirect(settingsUrl)
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[spotify/callback] token exchange failed:', tokenRes.status, await tokenRes.text())
    settingsUrl.searchParams.set('spotify_error', '1')
    return NextResponse.redirect(settingsUrl)
  }

  const { access_token, refresh_token, expires_in, scope } = await tokenRes.json()
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  let displayName: string | null = null
  const profileRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (profileRes.ok) {
    const sp = await profileRes.json()
    displayName = sp.display_name || sp.id || null
  } else {
    console.error('[spotify/callback] /me failed:', profileRes.status)
  }

  const { error: upsertError } = await supabase
    .from('spotify_tokens')
    .upsert(
      { user_id: user.id, access_token, refresh_token, expires_at: expiresAt, scope, display_name: displayName },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    console.error('[spotify/callback] upsert error:', upsertError.message)
    settingsUrl.searchParams.set('spotify_error', '1')
    return NextResponse.redirect(settingsUrl)
  }

  settingsUrl.searchParams.set('spotify_connected', '1')
  return NextResponse.redirect(settingsUrl)
}
