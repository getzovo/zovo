import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: labelProfile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (labelProfile?.account_type !== 'label') {
    return NextResponse.json({ error: 'Label account required' }, { status: 403 })
  }

  const { email } = await request.json() as { email: string }
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim())
  if (!targetUser) {
    return NextResponse.json({ error: 'No Zovo account found with that email.' }, { status: 404 })
  }

  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('account_type, label_id, artist_name')
    .eq('id', targetUser.id)
    .single()

  if (targetProfile?.account_type !== 'manager') {
    return NextResponse.json({ error: 'That account is not a manager account.' }, { status: 400 })
  }
  if (targetProfile?.label_id) {
    return NextResponse.json({ error: 'That manager is already linked to a label.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ label_id: user.id })
    .eq('id', targetUser.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, manager_name: targetProfile?.artist_name ?? email })
}
