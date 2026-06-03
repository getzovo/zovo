import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/spotify'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('artist_id').eq('id', user.id).single()
  if (!profile?.artist_id) return NextResponse.json([])

  const token = await getValidAccessToken(user.id)
  if (!token) return NextResponse.json([])

  const res = await fetch(
    `https://api.spotify.com/v1/artists/${profile.artist_id}/albums?limit=20&include_groups=album,single&market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return NextResponse.json([])
  const data = await res.json()
  return NextResponse.json(data.items || [])
}
