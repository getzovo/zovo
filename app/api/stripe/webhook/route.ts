import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  const PRICE_TO_TIER: Record<string, string> = {
    [process.env.STRIPE_PRICE_ARTIST_MONTHLY!]: 'artist',
    [process.env.STRIPE_PRICE_ARTIST_ANNUAL!]: 'artist',
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL!]: 'pro',
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price.id
    const tier = PRICE_TO_TIER[priceId] || 'free'
    const customerId = sub.customer as string
    await supabase.from('profiles').update({ tier, stripe_customer_id: customerId }).eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('profiles').update({ tier: 'free' }).eq('stripe_customer_id', sub.customer as string)
  }

  return NextResponse.json({ received: true })
}
