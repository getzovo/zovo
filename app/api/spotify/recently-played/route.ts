import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken } from '@/lib/spotify'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidAccessToken(user.id)
  if (!token) return NextResponse.json([])

  const res = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=10',
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  )

  if (!res.ok) return NextResponse.json([])
  const data = await res.json()
  return NextResponse.json(data.items || [])
}
