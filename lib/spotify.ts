import { createClient } from '@/lib/supabase/server'

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: token } = await supabase.from('spotify_tokens').select('*').eq('user_id', userId).single()
  if (!token) return null

  if (new Date(token.expires_at) > new Date(Date.now() + 60000)) return token.access_token

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token }),
  })

  if (!res.ok) return null
  const refreshed = await res.json()

  await supabase.from('spotify_tokens').update({
    access_token: refreshed.access_token,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
  }).eq('user_id', userId)

  return refreshed.access_token
}
