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
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontWeight: 400,
        fontSize: 56,
        letterSpacing: '0.02em',
        color: '#F5F5F0',
        lineHeight: 1,
        margin: '0 0 10px',
      }}>
        Submit Your Release
      </h1>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 15,
        color: '#8A8786',
        margin: 0,
      }}>
        Drop your details. We handle the rest.
      </p>
      <div style={{ height: 1, backgroundColor: '#1A1A1A', margin: '24px 0 32px' }} />

      <DistributionForm artistName={profile?.artist_name ?? ''} />
    </div>
  )
}
