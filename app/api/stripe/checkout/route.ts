import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId, context } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })

  const successUrl = context === 'onboarding'
    ? 'https://getzovo.app/onboarding?step=4'
    : 'https://getzovo.app/dashboard?upgraded=true'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: context === 'onboarding'
      ? 'https://getzovo.app/onboarding'
      : 'https://getzovo.app/dashboard/settings',
    client_reference_id: user.id,
  })

  return NextResponse.json({ url: session.url })
}
