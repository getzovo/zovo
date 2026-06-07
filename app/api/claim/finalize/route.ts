import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Resend } from 'resend'

function extractSpotifyId(input: string | null | undefined): string | null {
  if (!input) return null
  const m = input.match(/\/artist\/([a-zA-Z0-9]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim()
  return null
}

export async function POST(request: Request) {
  const { token, email, password } = await request.json() as {
    token: string
    email: string
    password: string
  }

  if (!token || !email?.trim() || !password) {
    return NextResponse.json({ error: 'token, email, and password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: invite, error: inviteError } = await admin
    .from('roster_invites')
    .select('id, manager_id, artist_name, genre, spotify_url, notes, status')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid claim token' }, { status: 404 })
  }
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'This profile has already been claimed' }, { status: 409 })
  }

  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })

  if (createError) {
    console.error('[claim/finalize] createUser error:', createError)
    const msg = createError.message.toLowerCase().includes('already')
      ? 'An account with this email already exists. Please sign in instead.'
      : createError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = authData.user.id
  const spotifyId = extractSpotifyId(invite.spotify_url)

  const { data: managerProfile } = await admin
    .from('profiles')
    .select('label_id')
    .eq('id', invite.manager_id)
    .single()
  const isLabelMember = !!managerProfile?.label_id

  const { error: profileUpdateError } = await admin.from('profiles').update({
    artist_name: invite.artist_name ?? null,
    genre: invite.genre ?? null,
    artist_id: spotifyId,
    onboarding_complete: true,
    account_type: 'artist',
    tier: 'pro',
    claimed: true,
    label_member: isLabelMember,
  }).eq('id', userId)

  if (profileUpdateError) {
    console.error('[claim/finalize] profile update error:', profileUpdateError)
  }

  await admin.from('rosters').insert({
    manager_id: invite.manager_id,
    artist_id: userId,
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  await admin.from('roster_invites').update({ status: 'claimed' }).eq('id', invite.id)

  const resend = new Resend(process.env.RESEND_API_KEY)
  resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: email.trim(),
    subject: "You're in. Welcome to Zovo.",
    html: `<p>Welcome to Zovo, ${invite.artist_name ?? 'artist'}! Your profile is ready at <a href="https://getzovo.app/dashboard">getzovo.app/dashboard</a>.</p>`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
