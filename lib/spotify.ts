import type { SupabaseClient } from '@supabase/supabase-js'

function basicAuth() {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')
}

export async function getFreshToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: token } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (!token) return null

  // Still valid with 60s buffer
  if (new Date(token.expires_at) > new Date(Date.now() + 60_000)) {
    return token.access_token
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  })

  if (!res.ok) return null

  const { access_token, expires_in, refresh_token: newRefresh } = await res.json()
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString()

  await supabase
    .from('spotify_tokens')
    .update({
      access_token,
      expires_at,
      ...(newRefresh ? { refresh_token: newRefresh } : {}),
    })
    .eq('user_id', userId)

  return access_token
}

export { basicAuth }
