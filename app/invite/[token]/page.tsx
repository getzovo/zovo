'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface InviteDetails {
  label_name: string
  email: string
  status: string
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
}

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
  fontWeight: 400,
  fontSize: 48,
  color: '#F5F5F0',
  lineHeight: 1.1,
  margin: '0 0 12px',
  letterSpacing: '0.02em',
}

const btn: React.CSSProperties = {
  width: '100%',
  background: '#FF4500',
  color: '#F5F5F0',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  fontWeight: 600,
  padding: '16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
}

const btnOutlined: React.CSSProperties = {
  ...btn,
  background: '#111111',
  border: '1px solid #2A2A2A',
  fontWeight: 500,
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [gone, setGone] = useState(false)
  const [authedUserId, setAuthedUserId] = useState<string | null>(undefined as unknown as null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const [inviteRes, supabase] = [fetch(`/api/label/invite/${token}`), createClient()]
      const { data: { user } } = await supabase.auth.getUser()
      setAuthedUserId(user?.id ?? null)

      const res = await inviteRes
      if (res.status === 404) { setNotFound(true); return }
      if (res.status === 410) { setGone(true); return }
      const data = await res.json()
      setInvite(data)
    }
    init()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError('')
    const res = await fetch(`/api/label/invite/${token}`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      setAccepting(false)
      return
    }
    setAccepted(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  const isLoading = invite === null && authedUserId === (undefined as unknown as null) && !notFound && !gone

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {isLoading && (
          <p style={{ ...mono, textAlign: 'center' }}>Loading invite…</p>
        )}

        {notFound && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...heading, fontSize: 36 }}>Invite not found.</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8786' }}>
              This invite link is invalid or has already been used.
            </p>
          </div>
        )}

        {gone && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...heading, fontSize: 36 }}>Invite already used.</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8786' }}>
              This invite has already been accepted or has expired.
            </p>
          </div>
        )}

        {invite && accepted && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...heading, fontSize: 40 }}>You&apos;re in.</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8786', marginBottom: 0 }}>
              Welcome to {invite.label_name}. Taking you to your dashboard…
            </p>
          </div>
        )}

        {invite && !accepted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ ...mono, marginBottom: 12 }}>Label invite</p>
              <h1 style={heading}>Join {invite.label_name}.</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8786', margin: 0 }}>
                You&apos;ve been invited to manage a roster for {invite.label_name} on Zovo.
              </p>
            </div>

            {authedUserId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>
                    {error}
                  </p>
                )}
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  style={{ ...btn, opacity: accepting ? 0.7 : 1, cursor: accepting ? 'default' : 'pointer' }}
                >
                  {accepting ? 'Accepting…' : `Accept invite to join ${invite.label_name}`}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => router.push(`/login?invite=${token}`)}
                  style={btn}
                >
                  I have an account — sign in to accept
                </button>
                <button
                  onClick={() => router.push(`/signup?type=manager&invite=${token}`)}
                  style={btnOutlined}
                >
                  I&apos;m new — create an account
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
