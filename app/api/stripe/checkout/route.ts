import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const PRICE_KEYS: Record<string, string> = {
  ARTIST_MONTHLY: 'STRIPE_PRICE_ARTIST_MONTHLY',
  ARTIST_ANNUAL: 'STRIPE_PRICE_ARTIST_ANNUAL',
  PRO_MONTHLY: 'STRIPE_PRICE_PRO_MONTHLY',
  PRO_ANNUAL: 'STRIPE_PRICE_PRO_ANNUAL',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceKey } = await request.json()
  const envKey = PRICE_KEYS[priceKey]
  const priceId = envKey ? process.env[envKey] : undefined
  if (!priceId) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, artist_name').eq('id', user.id).single()
  const stripe = getStripe()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.artist_name || undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const base = process.env.NEXT_PUBLIC_APP_URL!
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${base}/dashboard?upgraded=true`,
    cancel_url: `${base}/onboarding`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
