import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const PRICE_TO_TIER: Record<string, string> = {
  'price_1TdcFFEHkrUrKB7v9BeyOKTZ': 'artist',
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id

    if (!userId) {
      return NextResponse.json({ error: 'Missing client_reference_id' }, { status: 400 })
    }

    const subscriptionId = session.subscription as string
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = subscription.items.data[0]?.price.id
    const tier = PRICE_TO_TIER[priceId] ?? 'artist'

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ tier })
      .eq('id', userId)

    if (error) {
      console.error('[webhook] Failed to update profile tier:', error.message)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
