export interface Profile {
  id: string
  artist_name: string | null
  genre: string | null
  artist_id: string | null
  onboarding_complete: boolean
  tier: 'free' | 'artist' | 'pro'
  stripe_customer_id: string | null
  created_at: string
}

export interface Curator {
  id: string
  name: string
  playlist_name: string
  genre_tags: string[]
  submission_email: string
  platform: string
  followers: number | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Pitch {
  id: string
  user_id: string
  curator_id: string | null
  release_name: string
  release_type: string | null
  pitch_body: string
  status: 'draft' | 'sent' | 'opened' | 'replied'
  created_at: string
  curator?: Curator
}

export interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  release_date: string
  images: { url: string; width: number; height: number }[]
  artists: { id: string; name: string }[]
  total_tracks: number
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: {
    id: string
    name: string
    images: { url: string; width: number; height: number }[]
  }
  duration_ms: number
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack
  played_at: string
}
