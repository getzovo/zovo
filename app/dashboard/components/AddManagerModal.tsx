'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onClose: () => void
  onSuccess: (managerName: string) => void
}

export default function AddManagerModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!email.trim()) { setError('Please enter an email address.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/label/add-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to add manager.'); setLoading(false); return }
    onSuccess(data.manager_name ?? email)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 480, backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 32 }}
      >
        <div style={{ fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif', fontSize: 32, letterSpacing: '0.04em', color: '#F5F5F0', marginBottom: 8 }}>
          ADD MANAGER
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786', marginBottom: 28, lineHeight: 1.6 }}>
          Enter the email address of an existing Zovo manager account to link them to your label.
        </div>

        <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', display: 'block', marginBottom: 8 }}>
          Manager Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="manager@email.com"
          autoFocus
          style={{ width: '100%', background: '#111111', border: '1px solid #2A2A2A', padding: '14px 16px', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F5F5F0', outline: 'none', boxSizing: 'border-box', marginBottom: error ? 12 : 20 }}
        />
        {error && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ef4444', margin: '0 0 16px' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: '#8A8786', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', borderRadius: 6, border: '1px solid #2A2A2A', cursor: 'pointer' }}>
            CANCEL
          </button>
          <button onClick={handleAdd} disabled={loading} style={{ flex: 1, backgroundColor: '#FF4500', color: 'white', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', borderRadius: 6, border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : 'ADD MANAGER'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
