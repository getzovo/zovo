import { createAdminClient } from '@/lib/supabase-admin'
import ClaimForm from './ClaimForm'

function InvalidState({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
        ZOVO<span style={{ color: '#FF4500' }}>.</span>
      </span>
      <div style={{
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontSize: 28, letterSpacing: '0.02em', color: '#F5F5F0',
        marginTop: 48, textAlign: 'center', maxWidth: 480,
      }}>
        {message}
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', marginTop: 16, textAlign: 'center' }}>
        This link may have expired or already been used. Ask your manager to send a new invite.
      </p>
    </div>
  )
}

export default async function ClaimPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token

  if (!token) return <InvalidState message="MISSING CLAIM TOKEN." />

  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('roster_invites')
    .select('id, artist_name, genre, email, status, manager_id, spotify_url')
    .eq('token', token)
    .single()

  if (!invite || invite.status !== 'pending') {
    return <InvalidState message="THIS LINK IS INVALID OR HAS ALREADY BEEN USED." />
  }

  const { data: manager } = await admin
    .from('profiles')
    .select('artist_name')
    .eq('id', invite.manager_id)
    .single()

  return (
    <ClaimForm
      token={token}
      artistName={invite.artist_name ?? ''}
      genre={invite.genre ?? ''}
      claimEmail={invite.email ?? ''}
      managerName={manager?.artist_name ?? 'Your manager'}
    />
  )
}
