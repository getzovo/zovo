import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

type Params = { params: { pitchId: string } }

async function resolvePitchAccess(pitchId: string, userId: string) {
  const supabase = createServerSupabaseClient()
  const { data: pitch } = await supabase
    .from('pitches')
    .select('id, user_id, artist_id')
    .eq('id', pitchId)
    .single()

  if (!pitch) return { pitch: null, role: null as null }
  if (pitch.user_id === userId) return { pitch, role: 'manager' as const }
  if (pitch.artist_id === userId) return { pitch, role: 'artist' as const }
  return { pitch: null, role: null as null }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pitch } = await resolvePitchAccess(params.pitchId, user.id)
  if (!pitch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: notes } = await supabase
    .from('pitch_notes')
    .select('id, user_id, role, content, created_at')
    .eq('pitch_id', params.pitchId)
    .order('created_at', { ascending: true })

  return NextResponse.json(notes ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await resolvePitchAccess(params.pitchId, user.id)
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { content } = await req.json().catch(() => ({})) as { content?: string }
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: note, error } = await adminClient
    .from('pitch_notes')
    .insert({ pitch_id: params.pitchId, user_id: user.id, role, content: content.trim() })
    .select('id, user_id, role, content, created_at')
    .single()

  if (error) {
    console.error('[pitch_notes/post]', error.message)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }

  return NextResponse.json(note, { status: 201 })
}
