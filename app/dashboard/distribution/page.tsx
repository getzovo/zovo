import { createServerSupabaseClient } from '@/lib/supabase-server'
import DistributionForm from '@/components/dashboard/DistributionForm'

export default async function DistributionPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('artist_name').eq('id', user.id).single()
    : { data: null }

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
        Distribution
      </h1>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        color: 'var(--ink-muted)',
        margin: '0 0 32px',
      }}>
        Submit your music for distribution.
      </p>

      <DistributionForm artistName={profile?.artist_name ?? ''} />
    </div>
  )
}
