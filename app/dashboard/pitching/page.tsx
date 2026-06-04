import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function PitchingPage() {
  const supabase = createServerSupabaseClient()
  const { data: curators, error } = await supabase.from('curators').select('*')

  console.log('[pitching] curators error:', error)
  console.log('[pitching] curators count:', curators?.length)
  console.log('[pitching] curators sample:', JSON.stringify(curators?.slice(0, 2), null, 2))

  const count = curators?.length ?? 0

  return (
    <div style={{ padding: '40px 40px 60px' }}>
      <h1 style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 32,
        letterSpacing: '-0.03em',
        color: 'var(--ink)',
        lineHeight: 1.2,
        margin: '0 0 8px',
      }}>
        Curator Database
      </h1>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        color: 'var(--ink-muted)',
        margin: '0 0 32px',
      }}>
        Find the right curators for your music.
      </p>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 14,
        color: 'var(--ink)',
      }}>
        {count} curators
      </p>
    </div>
  )
}
