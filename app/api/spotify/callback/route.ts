import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { basicAuth } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const cookieStore = cookies()
  const savedState = cookieStore.get('spotify_oauth_state')?.value
  cookieStore.delete('spotify_oauth_state')

  const fail = () =>
    NextResponse.redirect(new URL('/dashboard?error=spotify_auth_failed', request.url))

  if (error || !code || !savedState || state !== savedState) return fail()

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  })

  if (!tokenRes.ok) return fail()

  const { access_token, refresh_token, expires_in, scope } = await tokenRes.json()
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString()

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  await supabase.from('spotify_tokens').upsert(
    { user_id: user.id, access_token, refresh_token, expires_at, scope },
    { onConflict: 'user_id' }
  )

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
