import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_id')
    .eq('id', user.id)
    .single()

  if (profile?.artist_id) {
    const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const host = headers().get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    try {
      await fetch(`${proto}://${host}/api/spotify/artist-stats`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store',
      })
    } catch {
      // Non-fatal — dashboard will fetch on first load
    }
  }

  return NextResponse.json({ ok: true })
}
