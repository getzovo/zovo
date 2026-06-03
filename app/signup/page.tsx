'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Wordmark from '@/components/Wordmark'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) { setError(error.message); setLoading(false) }
    else router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Link href="/"><Wordmark size="lg" /></Link>
        </div>

        <h1 className="text-3xl mb-2 text-center" style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, letterSpacing: '-0.03em' }}>
          Create your account.
        </h1>
        <p className="text-center mb-8" style={{ color: '#8A8786' }}>Start building your music career</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}
          <div>
            <label className="label block mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
          </div>
          <div>
            <label className="label block mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="input" />
          </div>
          <div>
            <label className="label block mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-6" style={{ color: '#8A8786', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#111010', fontWeight: 500, textDecoration: 'underline' }}>Sign in</Link>
        </p>
        <p className="text-center mt-3" style={{ color: '#8A8786', fontSize: '12px' }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: '#111010', textDecoration: 'underline' }}>Terms</Link> and{' '}
          <Link href="/privacy" style={{ color: '#111010', textDecoration: 'underline' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
