import { createServerSupabaseClient } from '@/lib/supabase-server'
import PitchHistoryClient from './PitchHistoryClient'

export default async function PitchHistory() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pitches } = await supabase
    .from('pitches')
    .select('id, release_name, status, created_at, curator_id, curators(name, playlist_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PitchHistoryClient pitches={pitches ?? []} />
}
