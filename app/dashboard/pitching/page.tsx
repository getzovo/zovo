import { createServerSupabaseClient } from '@/lib/supabase-server'
import CuratorGrid from '@/components/pitching/CuratorGrid'
import PitchHistory from '@/components/pitching/PitchHistory'
import { type Curator } from '@/components/pitching/CuratorCard'

export default async function PitchingPage() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: curators, error }, { data: profile }] = await Promise.all([
    supabase.from('curators').select('*').eq('active', true).order('followers', { ascending: false }),
    user ? supabase.from('profiles').select('account_type').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])

  const isManager = profile?.account_type === 'manager'

  console.log('[pitching] error:', error)
  console.log('[pitching] count:', curators?.length)

  return (
    <div style={{ padding: '40px 40px 60px' }}>
      <h1 style={{
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontWeight: 400,
        fontSize: 40,
        letterSpacing: '0.02em',
        color: '#F5F5F0',
        lineHeight: 1.1,
        margin: '0 0 8px',
      }}>
        Curator Database
      </h1>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        color: '#8A8786',
        margin: '0 0 32px',
      }}>
        Find the right curators for your music.
      </p>

      <CuratorGrid curators={(curators as Curator[]) ?? []} isManager={isManager} />
      <PitchHistory />
    </div>
  )
}
