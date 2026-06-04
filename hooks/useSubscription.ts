'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Tier = 'free' | 'artist' | 'pro'

export function useSubscription() {
  const [tier, setTier] = useState<Tier>('free')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single()

      if (profile?.tier) setTier(profile.tier as Tier)
      setIsLoading(false)
    }

    load()
  }, [])

  return {
    tier,
    isLoading,
    isFree: tier === 'free',
    isArtist: tier === 'artist',
    isPro: tier === 'pro',
  }
}
