'use client';

import { useState } from 'react';
import Wordmark from '@/components/wordmark';

export default function Home() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--warm-white)', display: 'flex', flexDirection: 'column' }}>
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 120px',
      }}>
        <div style={{ marginBottom: 48 }}>
          <Wordmark size="lg" />
        </div>

        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 500,
          fontSize: 48,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          lineHeight: 1.15,
          margin: '0 0 20px',
          maxWidth: 560,
        }}>
          Your AI music career manager.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: 'var(--ink-muted)',
          maxWidth: 400,
          margin: '0 0 40px',
          lineHeight: 1.65,
        }}>
          One platform to manage your releases, pitch curators, distribute your music, and grow your career — with AI guiding every step.
        </p>

        {submitted ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: 'var(--ink-soft)',
          }}>
            You&apos;re on the list. We&apos;ll be in touch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 480,
          }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                flex: '1 1 200px',
                border: '1px solid var(--border)',
                background: '#fff',
                padding: '12px 16px',
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                flex: '0 0 auto',
                background: 'var(--ink)',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Join the waitlist
            </button>
          </form>
        )}

        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginTop: 40,
        }}>
          Launching July 2026
        </p>
      </main>

      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '16px 24px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>
        © 2026 Cole Ventures Group LLC · Zovo
      </footer>
    </div>
  );
}
