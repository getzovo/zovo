'use client';

import { useState } from 'react';
import Link from 'next/link';
import Wordmark from '@/components/wordmark';
import { createClient } from '@/lib/supabase';

const label: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  display: 'block',
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  background: '#fff',
  padding: '12px 16px',
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: 'var(--ink)',
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
      setSuccess(true);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--warm-white)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <Wordmark size="md" />
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 500,
          fontSize: 36,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          lineHeight: 1.2,
          margin: '0 0 8px',
          textAlign: 'center',
        }}>
          Create your account.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: 'var(--ink-muted)',
          margin: '0 0 32px',
          textAlign: 'center',
        }}>
          Start managing your music career
        </p>

        {success ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: 'var(--ink)',
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
                color: '#cc0000',
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
                background: '#111010',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                padding: '14px',
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
          color: 'var(--ink-muted)',
          textAlign: 'center',
          marginTop: 24,
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
