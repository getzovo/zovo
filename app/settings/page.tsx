'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  { name: 'Free', price: '$0/mo', features: ['3 pitches/month', 'Basic dashboard'] },
  { name: 'Artist', price: '$29/mo', features: ['Unlimited pitches', 'AI generation', 'Priority support'] },
  { name: 'Pro', price: '$149/mo', features: ['Everything in Artist', 'Music distribution', 'Advanced AI'] },
]

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [artistName, setArtistName] = useState('')
  const [genre, setGenre] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setEmail(data.user.email || '')
      supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => {
        if (p) {
          setProfile(p)
          setArtistName(p.artist_name || '')
          setGenre(p.genre || '')
        }
      })
    })
  }, [router])

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ artist_name: artistName, genre }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function manageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    // Delete handled server-side; for now just sign out
    await handleSignOut()
  }

  if (!profile) return null

  return (
    <AppLayout tier={profile?.tier}>
      <div className="mb-8">
        <h1 className="text-4xl" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.03em' }}>Settings</h1>
      </div>

      {/* Profile */}
      <div className="card mb-6">
        <p className="label mb-4">Profile</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label block mb-1.5">Email</label>
            <input className="input" value={email} disabled style={{ color: '#8A8786' }} />
          </div>
          <div>
            <label className="label block mb-1.5">Artist Name</label>
            <input className="input" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Genre</label>
            <input className="input" value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Subscription</p>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
            backgroundColor: profile?.tier === 'pro' ? '#111010' : '#F2EFEA',
            color: profile?.tier === 'pro' ? '#FAF8F5' : '#8A8786',
            padding: '2px 10px', borderRadius: '20px', border: '1px solid #E2DED8',
          }}>
            {(profile?.tier || 'free').charAt(0).toUpperCase() + (profile?.tier || 'free').slice(1)} Plan
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className="p-3 rounded-lg" style={{ border: profile?.tier === plan.name.toLowerCase() ? '2px solid #111010' : '1px solid #E2DED8', backgroundColor: '#F2EFEA' }}>
              <p className="label mb-1">{plan.name}</p>
              <p className="font-medium text-sm mb-2" style={{ fontFamily: 'Fraunces, serif' }}>{plan.price}</p>
              <ul className="text-xs space-y-0.5" style={{ color: '#8A8786' }}>
                {plan.features.map((f) => <li key={f}>· {f}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {profile?.tier !== 'free' ? (
          <button onClick={manageSubscription} className="btn-ghost">Manage subscription</button>
        ) : (
          <button onClick={() => router.push('/onboarding')} className="btn-primary">Upgrade plan →</button>
        )}
      </div>

      {/* Account */}
      <div className="card">
        <p className="label mb-4">Account</p>
        <div className="flex gap-3">
          <button onClick={handleSignOut} className="btn-ghost">Sign out</button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: '6px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
              backgroundColor: confirmDelete ? '#EF4444' : 'transparent',
              color: confirmDelete ? '#FAF8F5' : '#EF4444',
              border: `1px solid ${confirmDelete ? '#EF4444' : '#FECACA'}`,
              cursor: 'pointer',
            }}
          >
            {confirmDelete ? 'Click again to confirm deletion' : 'Delete account'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
