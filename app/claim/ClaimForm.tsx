'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111111',
  border: '1px solid #2A2A2A',
  padding: '14px 16px',
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: '#F5F5F0',
  outline: 'none',
  boxSizing: 'border-box',
}

interface Props {
  token: string
  artistName: string
  genre: string
  claimEmail: string
  managerName: string
}

export default function ClaimForm({ token, artistName, genre, claimEmail, managerName }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState(claimEmail)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/claim/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email: email.trim(), password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('Account created but sign-in failed. Please go to the login page.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 12 }}>
          Roster Invite
        </div>

        <h1 style={{
          fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
          fontWeight: 400, fontSize: 40, letterSpacing: '0.02em',
          color: '#F5F5F0', lineHeight: 1, margin: '0 0 16px',
        }}>
          YOU&apos;VE BEEN ADDED TO A ROSTER.
        </h1>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#8A8786', margin: '0 0 32px', lineHeight: 1.6 }}>
          {managerName} has set up your Zovo profile. Create your account to access your AI music career dashboard.
        </p>

        {(artistName || genre) && (
          <div style={{
            backgroundColor: '#111111', border: '1px solid #1A1A1A',
            borderRadius: 8, padding: '16px 20px', marginBottom: 32,
          }}>
            {artistName && (
              <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 22, letterSpacing: '0.02em', color: '#F5F5F0', marginBottom: genre ? 4 : 0 }}>
                {artistName}
              </div>
            )}
            {genre && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8786' }}>
                {genre}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#FF4444', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#FF4500', color: '#F5F5F0',
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '16px', borderRadius: 8, border: 'none',
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'CLAIMING...' : 'CLAIM YOUR PROFILE'}
          </button>
        </form>
      </div>
    </div>
  )
}
