'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--off-white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 28,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>
        {subtext}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [artistName, setArtistName] = useState('');
  const now = new Date();
  const dateHeader = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const greeting = getGreeting(now.getHours());

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('artist_name')
        .eq('id', user.id)
        .single();
      if (profile?.artist_name) setArtistName(profile.artist_name);
    })();
  }, []);

  return (
    <div style={{ padding: '40px 40px 60px' }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        marginBottom: 10,
      }}>
        {dateHeader}
      </div>

      <h1 style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 32,
        letterSpacing: '-0.03em',
        color: 'var(--ink)',
        lineHeight: 1.2,
        margin: '0 0 32px',
      }}>
        {greeting}{artistName ? `, ${artistName}` : ''}.
      </h1>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Releases" value="--" subtext="Total catalog" />
        <StatCard label="Latest Drop" value="--" subtext="Most recent release" />
        <StatCard label="Release Pace" value="--" subtext="Avg between drops" />
        <StatCard label="Last Played" value="--" subtext="Recently played" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 6px',
        }}>
          Connect Spotify to see your stats
        </p>
        <Link
          href="/onboarding"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: 'var(--ink)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Connect Spotify →
        </Link>
      </div>
    </div>
  );
}
