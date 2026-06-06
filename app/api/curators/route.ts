import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: curators } = await supabase
    .from('curators')
    .select('*')
    .eq('active', true)
    .order('followers', { ascending: false })

  return NextResponse.json(curators ?? [])
}
