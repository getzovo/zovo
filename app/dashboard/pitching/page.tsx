import { createServerSupabaseClient } from '@/lib/supabase-server'
import CuratorCard, { type Curator } from '@/components/pitching/CuratorCard'

export default async function PitchingPage() {
  const supabase = createServerSupabaseClient()
  const { data: curators, error } = await supabase
    .from('curators')
    .select('*')
    .eq('active', true)
    .order('followers', { ascending: false })

  console.log('[pitching] error:', error)
  console.log('[pitching] count:', curators?.length)

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

      {curators && curators.length > 0 ? (
        <div className="curator-grid">
          {curators.map((curator: Curator) => (
            <CuratorCard key={curator.id} curator={curator} />
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
        }}>
          No curators found.
        </p>
      )}
    </div>
  )
}
