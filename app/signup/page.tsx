'use client';

import { useState } from 'react';
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

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      const firstName = email.split('@')[0].split('.')[0].split('_')[0];
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      }).catch(() => {});
      setSuccess(true);
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
          CREATE YOUR ACCOUNT.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: '#8A8786',
          margin: '0 0 32px',
          textAlign: 'center',
        }}>
          Start managing your music career
        </p>

        {success ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: '#F5F5F0',
            textAlign: 'center',
            padding: '20px 0',
          }}>
            Check your email to confirm your account.
          </p>
        ) : (
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
                minLength={8}
                autoComplete="new-password"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                style={input}
              />
            </div>

            {error && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#FF4444',
                margin: 0,
              }}>
                {error}
              </p>
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#8A8786',
          textAlign: 'center',
          marginTop: 24,
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#F5F5F0', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
