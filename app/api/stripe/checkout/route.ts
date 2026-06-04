import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
  });
  const { priceId, userId } = await request.json();

  if (!priceId || !userId) {
    return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://getzovo.app/onboarding?step=4',
    cancel_url: 'https://getzovo.app/onboarding?step=3',
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
