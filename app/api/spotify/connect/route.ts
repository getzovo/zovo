import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!
  const scope = 'user-read-private user-read-email'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
  })

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  )
}
