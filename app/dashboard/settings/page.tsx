import { createServerSupabaseClient } from '@/lib/supabase-server'
import SettingsForm from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('artist_name, genre, tier')
    .eq('id', user!.id)
    .single()

  return (
    <div style={{ padding: '40px 40px 60px', maxWidth: 580 }}>
      <h1 style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 32,
        letterSpacing: '-0.03em',
        color: 'var(--ink)',
        lineHeight: 1.2,
        margin: '0 0 32px',
      }}>
        Settings
      </h1>

      <SettingsForm
        userId={user!.id}
        email={user!.email ?? ''}
        artistName={profile?.artist_name ?? ''}
        genre={profile?.genre ?? ''}
        tier={profile?.tier ?? 'free'}
      />
    </div>
  )
}
