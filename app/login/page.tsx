'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const label: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8A8786',
  display: 'block',
  marginBottom: 6,
};

const input: React.CSSProperties = {
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
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResentOk(false);
    const supabase = createClient();
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    setResentOk(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnconfirmed(false);
    setResentOk(false);

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const isUnconfirmed = authError.message.toLowerCase().includes('email not confirmed')
      setUnconfirmed(isUnconfirmed);
      setError(authError.message);
      setLoading(false);
    } else {
      let dest = '/dashboard';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
        if (profile?.account_type === 'label') dest = '/label';
      }
      router.push(dest);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px 40px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{
          fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
          fontSize: 32,
          color: '#F5F5F0',
          letterSpacing: '0.05em',
        }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{
          fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '0.02em',
          color: '#F5F5F0',
          lineHeight: 1.1,
          margin: '0 0 8px',
          textAlign: 'center',
        }}>
          WELCOME BACK.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: '#8A8786',
          margin: '0 0 32px',
          textAlign: 'center',
        }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={input}
            />
          </div>

          <div>
            <label style={label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={input}
            />
          </div>

          {error && (
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#FF4444',
                margin: '0 0 8px',
              }}>
                {error}
              </p>
              {unconfirmed && email && (
                resentOk ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#22C55E', margin: 0 }}>
                    Confirmation email sent — check your inbox.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: '#F5F5F0',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: resending ? 'default' : 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      opacity: resending ? 0.6 : 1,
                    }}
                  >
                    {resending ? 'Sending…' : 'Resend confirmation email'}
                  </button>
                )
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#FF4500',
              color: '#F5F5F0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#8A8786',
          textAlign: 'center',
          marginTop: 24,
        }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#F5F5F0', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
