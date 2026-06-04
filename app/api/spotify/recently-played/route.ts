import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFreshToken } from '@/lib/spotify'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getFreshToken(supabase, user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'spotify_not_connected' }, { status: 400 })
  }

  const res = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=5',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracks = (data.items ?? []).map((item: any) => ({
    name: item.track.name,
    artists: item.track.artists.map((a: { name: string }) => a.name).join(', '),
    album_art: item.track.album.images[0]?.url ?? null,
    played_at: item.played_at,
  }))

  return NextResponse.json({ tracks })
}
