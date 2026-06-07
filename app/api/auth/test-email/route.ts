import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  console.log('[test-email] RESEND_API_KEY prefix:', apiKey ? apiKey.slice(0, 10) : 'MISSING')
  console.log('[test-email] RESEND_FROM_EMAIL:', fromEmail ?? 'MISSING')

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: fromEmail as string,
    to: 'robertlwcole@gmail.com',
    subject: 'Zovo test',
    html: '<p>test</p>',
  })

  console.log('[test-email] Resend result:', JSON.stringify({ data, error }))

  return NextResponse.json({
    apiKeyPrefix: apiKey ? apiKey.slice(0, 10) : 'MISSING',
    fromEmail: fromEmail ?? 'MISSING',
    data,
    error,
  })
}
