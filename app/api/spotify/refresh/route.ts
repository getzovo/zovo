import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFreshToken } from '@/lib/spotify'

export async function POST(request: NextRequest) {
  const { user_id } = await request.json()
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const access_token = await getFreshToken(supabase, user_id)

  if (!access_token) {
    return NextResponse.json({ error: 'Token not found or refresh failed' }, { status: 401 })
  }

  return NextResponse.json({ access_token })
}
