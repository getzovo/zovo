'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Wordmark from './Wordmark'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pitching', href: '/pitching' },
  { label: 'Distribution', href: '/distribution' },
  { label: 'Settings', href: '/settings' },
]

export default function Sidebar({ tier = 'free' }: { tier?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col" style={{ backgroundColor: '#FAF8F5', borderRight: '1px solid #E2DED8' }}>
      <div className="px-5 py-6">
        <Link href="/dashboard"><Wordmark size="md" /></Link>
      </div>

      <nav className="flex-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 rounded-md mb-0.5 transition-colors"
              style={{
                backgroundColor: isActive ? '#F2EFEA' : 'transparent',
                color: isActive ? '#111010' : '#8A8786',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: isActive ? 500 : 400,
                borderLeft: isActive ? '2px solid #E8440A' : '2px solid transparent',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4" style={{ borderTop: '1px solid #E2DED8' }}>
        <div className="mb-3">
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backgroundColor: '#F2EFEA',
            color: tier === 'pro' ? '#E8440A' : '#8A8786',
            border: '1px solid #E2DED8',
            padding: '2px 8px',
            borderRadius: '20px',
          }}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
          </span>
        </div>
        <button onClick={handleSignOut} style={{ color: '#8A8786', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
