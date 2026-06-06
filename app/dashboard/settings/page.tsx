import { createServerSupabaseClient } from '@/lib/supabase-server'
import SettingsForm from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: spotifyToken }] = await Promise.all([
    supabase
      .from('profiles')
      .select('artist_name, genre, tier, account_type')
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
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        fontWeight: 400,
        fontSize: 40,
        letterSpacing: '0.02em',
        color: '#F5F5F0',
        lineHeight: 1.1,
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
        accountType={profile?.account_type ?? 'artist'}
        artistMonthlyPriceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_MONTHLY ?? ''}
        spotifyDisplayName={spotifyToken?.display_name ?? null}
      />
    </div>
  )
}
