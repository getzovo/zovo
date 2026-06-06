'use client'

import { useEffect, useState } from 'react'

const ARTIST_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_ARTIST_MONTHLY_PRICE_ID ?? 'price_1TdcFFEHkrUrKB7v9BeyOKTZ'

interface Props {
  isOpen: boolean
  onClose: () => void
  featureName: string
}

export default function UpgradeModal({ isOpen, onClose, featureName }: Props) {
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: ARTIST_PRICE_ID }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setUpgrading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 16, 16, 0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#111111',
          border: '1px solid #1A1A1A',
          borderRadius: 10,
          padding: 28,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{
            fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: '0.02em',
            color: '#F5F5F0',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Unlock {featureName}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8A8786',
              padding: 4,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: 8,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#F5F5F0',
            margin: 0,
            lineHeight: 1.6,
          }}>
            This feature is available on the Artist plan.
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 28,
              color: '#F5F5F0',
              lineHeight: 1,
            }}>
              $29
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.06em',
              color: '#8A8786',
            }}>
              / month
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: '#F5F5F0',
              backgroundColor: '#FF4500',
              border: 'none',
              borderRadius: 8,
              padding: '11px 0',
              cursor: upgrading ? 'not-allowed' : 'pointer',
              opacity: upgrading ? 0.6 : 1,
              width: '100%',
              transition: 'opacity 0.15s',
            }}
          >
            {upgrading ? 'Redirecting…' : 'Upgrade to Artist'}
          </button>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: 14,
              color: '#8A8786',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              width: '100%',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
