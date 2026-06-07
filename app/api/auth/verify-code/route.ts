import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  const { email, code, type = 'signup' } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: 'email and code required' }, { status: 400 })
  }

  const admin = adminClient()

  const { data: codeRow } = await admin
    .from('verification_codes')
    .select('id, code, user_id')
    .eq('email', email)
    .eq('type', type)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!codeRow || codeRow.code !== code) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  await admin.from('verification_codes').update({ used: true }).eq('id', codeRow.id)

  await admin.auth.admin.updateUserById(codeRow.user_id, { email_confirm: true })

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ token_hash: linkData.properties.hashed_token })
}
