'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Wordmark from '@/components/wordmark';
import { createClient } from '@/lib/supabase';

const PLAN_LABELS: Record<string, string> = {
  free: 'FREE PLAN',
  artist: 'ARTIST PLAN',
  pro: 'PRO PLAN',
};

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Pitching',
    href: '/dashboard/pitching',
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 12V4L13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11.5" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Distribution',
    href: '/dashboard/distribution',
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M8 10V3M8 3L5 6M8 3L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11V13H13V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function SidebarContent({
  tier,
  pathname,
  onClose,
  onSignOut,
}: {
  tier: string;
  pathname: string;
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const planLabel = PLAN_LABELS[tier] ?? 'FREE PLAN';

  return (
    <>
      <div style={{
        padding: '24px 24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Wordmark size="sm" />
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-muted)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '0 0 8px' }} />

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(({ label, href, exact, icon }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--off-white)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'background-color 0.1s',
              }}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          backgroundColor: 'var(--off-white)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '5px 8px',
          display: 'inline-block',
          marginBottom: 10,
          color: 'var(--ink)',
        }}>
          {planLabel}
        </div>
        <div>
          <button
            onClick={onSignOut}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardSidebar({ tier }: { tier: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <aside className="sidebar-wrapper">
        <SidebarContent tier={tier} pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 99,
            }}
          />
          <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 240,
            backgroundColor: 'var(--warm-white)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}>
            <SidebarContent
              tier={tier}
              pathname={pathname}
              onClose={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
            />
          </aside>
        </>
      )}
    </>
  );
}
