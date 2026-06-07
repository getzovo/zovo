'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface InviteDetails { label_name: string; email: string; status: string }

const BB  = 'var(--font-bebas), "Bebas Neue", sans-serif'
const DM  = "'DM Sans', sans-serif"
const DMM = "'DM Mono', monospace"

const mono: React.CSSProperties = { fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786', display: 'block', marginBottom: 6 }
const h1: React.CSSProperties  = { fontFamily: BB, fontWeight: 400, fontSize: 48, color: '#F5F5F0', lineHeight: 1.05, margin: '0 0 12px', letterSpacing: '0.02em' }
const input: React.CSSProperties = { width: '100%', background: '#111111', border: '1px solid #2A2A2A', padding: '14px 16px', borderRadius: 8, fontFamily: DM, fontSize: 15, color: '#F5F5F0', outline: 'none', boxSizing: 'border-box' }
const btnFill: React.CSSProperties = { width: '100%', background: '#FF4500', color: '#F5F5F0', fontFamily: DM, fontSize: 15, fontWeight: 600, padding: '16px', borderRadius: 8, border: 'none', cursor: 'pointer' }

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [invite, setInvite]       = useState<InviteDetails | null>(null)
  const [notFound, setNotFound]   = useState(false)
  const [gone, setGone]           = useState(false)
  const [authedUserId, setAuthedUserId] = useState<string | null>(undefined as unknown as null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted]   = useState(false)
  const [acceptErr, setAcceptErr] = useState('')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [formErr, setFormErr]   = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const [{ data: { user } }, res] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/label/invite/${token}`),
      ])
      setAuthedUserId(user?.id ?? null)
      if (res.status === 404) { setNotFound(true); return }
      if (res.status === 410) { setGone(true); return }
      const data = await res.json()
      setInvite(data)
      if (data.email && !user) setEmail(data.email)
    }
    init()
  }, [token])

  async function handleAccept() {
    setAccepting(true); setAcceptErr('')
    const res = await fetch(`/api/label/invite/${token}`, { method: 'POST' })
    if (!res.ok) {
      setAcceptErr((await res.json()).error ?? 'Something went wrong.')
      setAccepting(false); return
    }
    setAccepted(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setFormErr('')
    if (password !== confirm) { setFormErr('Passwords do not match.'); return }
    setFormLoading(true)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setFormErr(authError.message); setFormLoading(false); return }

    const userId = authData.user?.id ?? ''
    await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId, type: 'signup' }),
    })

    const p = new URLSearchParams({ email, userId, type: 'manager', invite: token })
    router.push(`/verify?${p.toString()}`)
  }

  const isLoading = invite === null && authedUserId === (undefined as unknown as null) && !notFound && !gone

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ fontFamily: BB, fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {isLoading && <p style={{ ...mono, display: 'block', textAlign: 'center' }}>Loading invite…</p>}

        {notFound && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...h1, fontSize: 36 }}>Invite not found.</h1>
            <p style={{ fontFamily: DM, fontSize: 16, color: '#8A8786' }}>This invite link is invalid or has already been used.</p>
          </div>
        )}

        {gone && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...h1, fontSize: 36 }}>Invite already used.</h1>
            <p style={{ fontFamily: DM, fontSize: 16, color: '#8A8786' }}>This invite has already been accepted or has expired.</p>
          </div>
        )}

        {invite && accepted && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ ...h1, fontSize: 40 }}>You&apos;re in.</h1>
            <p style={{ fontFamily: DM, fontSize: 16, color: '#8A8786' }}>Welcome to {invite.label_name}. Taking you to your dashboard…</p>
          </div>
        )}

        {invite && !accepted && authedUserId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ ...mono, marginBottom: 12, display: 'block' }}>Label invite</p>
              <h1 style={h1}>Join {invite.label_name}.</h1>
              <p style={{ fontFamily: DM, fontSize: 16, color: '#8A8786', margin: 0 }}>
                You&apos;ve been invited to manage a roster for {invite.label_name} on Zovo.
              </p>
            </div>
            {acceptErr && <p style={{ fontFamily: DM, fontSize: 14, color: '#FF4444', margin: 0 }}>{acceptErr}</p>}
            <button onClick={handleAccept} disabled={accepting}
              style={{ ...btnFill, opacity: accepting ? 0.7 : 1, cursor: accepting ? 'default' : 'pointer' }}>
              {accepting ? 'Accepting…' : `Accept invite to join ${invite.label_name}`}
            </button>
          </div>
        )}

        {invite && !accepted && authedUserId === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ ...mono, marginBottom: 12, display: 'block' }}>Label invite</p>
              <h1 style={h1}>JOIN {invite.label_name.toUpperCase()}.</h1>
              <p style={{ fontFamily: DM, fontSize: 16, color: '#8A8786', margin: 0, lineHeight: 1.6 }}>
                You&apos;ve been invited to manage a roster for {invite.label_name} on Zovo. Create your account to get started.
              </p>
            </div>
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={mono}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={input} />
              </div>
              <div>
                <label style={mono}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={input} />
              </div>
              <div>
                <label style={mono}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} style={input} />
              </div>
              {formErr && <p style={{ fontFamily: DM, fontSize: 14, color: '#FF4444', margin: 0 }}>{formErr}</p>}
              <button type="submit" disabled={formLoading}
                style={{ ...btnFill, opacity: formLoading ? 0.7 : 1, cursor: formLoading ? 'default' : 'pointer' }}>
                {formLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
            <p style={{ fontFamily: DM, fontSize: 14, color: '#8A8786', textAlign: 'center', margin: 0 }}>
              Already have an account?{' '}
              <button onClick={() => router.push(`/login?invite=${token}`)}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: DM, fontSize: 14, color: '#F5F5F0', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
