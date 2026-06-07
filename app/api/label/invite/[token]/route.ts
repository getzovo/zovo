import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const admin = adminClient()

  const { data: invite } = await admin
    .from('label_invites')
    .select('email, status, label_id')
    .eq('token', params.token)
    .single()

  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invite no longer valid' }, { status: 410 })
  }

  const { data: label } = await admin
    .from('labels')
    .select('name')
    .eq('id', invite.label_id)
    .single()

  return NextResponse.json({
    label_name: label?.name ?? 'Unknown Label',
    email: invite.email,
    status: invite.status,
  })
}

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  const { data: invite } = await admin
    .from('label_invites')
    .select('id, label_id, status')
    .eq('token', params.token)
    .single()

  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invite no longer valid' }, { status: 410 })
  }

  const { data: label } = await admin
    .from('labels')
    .select('owner_user_id')
    .eq('id', invite.label_id)
    .single()
  if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 })

  const now = new Date().toISOString()

  await Promise.all([
    admin
      .from('profiles')
      .upsert({ id: user.id, label_id: label.owner_user_id, account_type: 'manager', onboarding_complete: true }, { onConflict: 'id' }),
    admin
      .from('label_invites')
      .update({ status: 'accepted', accepted_at: now })
      .eq('id', invite.id),
    admin
      .from('label_managers')
      .insert({ label_id: invite.label_id, manager_user_id: user.id, accepted_at: now }),
  ])

  return NextResponse.json({ ok: true })
}
