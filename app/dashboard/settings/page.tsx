import { createServerSupabaseClient } from '@/lib/supabase-server'
import SettingsForm from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: spotifyToken }] = await Promise.all([
    supabase
      .from('profiles')
      .select('artist_name, genre, tier')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('spotify_tokens')
      .select('display_name')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

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
        artistMonthlyPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_MONTHLY ?? ''}
        spotifyDisplayName={spotifyToken?.display_name ?? null}
      />
    </div>
  )
}
