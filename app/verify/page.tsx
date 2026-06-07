'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const BB  = 'var(--font-bebas), "Bebas Neue", sans-serif';
const DM  = "'DM Sans', sans-serif";
const DMM = "'DM Mono', monospace";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email  = searchParams.get('email')  ?? '';
  const userId = searchParams.get('userId') ?? '';
  const type   = searchParams.get('type')   ?? '';
  const invite = searchParams.get('invite') ?? '';
  const label  = searchParams.get('label')  ?? '';

  const [digits, setDigits]   = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resent, setResent]   = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const code = digits.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type: 'signup' }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Invalid or expired code'); setLoading(false); return; }

    const supabase = createClient();
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: json.token_hash,
      type: 'magiclink',
    });
    if (sessionError) { setError(sessionError.message); setLoading(false); return; }

    const p = new URLSearchParams();
    if (type)   p.set('type', type);
    if (invite) p.set('invite', invite);
    if (label)  p.set('label', label);
    router.push(p.toString() ? `/onboarding?${p.toString()}` : '/onboarding');
  }

  async function handleResend() {
    setResent(false);
    await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId, type: 'signup' }),
    });
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  const allFilled = digits.every(d => d !== '');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ fontFamily: BB, fontSize: 32, color: '#F5F5F0', letterSpacing: '0.05em' }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontFamily: BB, fontWeight: 400, fontSize: 48, letterSpacing: '0.02em', color: '#F5F5F0', lineHeight: 1.05, margin: '0 0 12px' }}>
          CHECK YOUR EMAIL.
        </h1>
        <p style={{ fontFamily: DM, fontSize: 15, color: '#8A8786', margin: '0 0 40px', lineHeight: 1.6 }}>
          We sent a 6-digit code to <span style={{ color: '#F5F5F0' }}>{email}</span>
        </p>

        {/* Digit boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 52, height: 60, textAlign: 'center',
                fontFamily: DMM, fontSize: 24, color: '#F5F5F0',
                backgroundColor: '#111111',
                border: `1px solid ${d ? '#FF4500' : '#2A2A2A'}`,
                borderRadius: 8, outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: DM, fontSize: 14, color: '#FF4444', margin: '0 0 16px' }}>{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || !allFilled}
          style={{ width: '100%', background: '#FF4500', color: '#F5F5F0', fontFamily: DM, fontSize: 15, fontWeight: 600, padding: '16px', borderRadius: 8, border: 'none', cursor: loading || !allFilled ? 'default' : 'pointer', opacity: loading || !allFilled ? 0.6 : 1, marginBottom: 20 }}
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>

        <p style={{ fontFamily: DM, fontSize: 14, color: '#8A8786', margin: 0 }}>
          {resent ? (
            <span style={{ color: '#22C55E' }}>Code resent.</span>
          ) : (
            <>
              Didn&apos;t receive a code?{' '}
              <button onClick={handleResend} style={{ background: 'none', border: 'none', padding: 0, fontFamily: DM, fontSize: 14, color: '#F5F5F0', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Resend
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}
