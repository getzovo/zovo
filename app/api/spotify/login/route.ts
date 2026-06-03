import { NextResponse } from 'next/server'

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-read-playback-state',
].join(' ')

export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    show_dialog: 'true',
  })
  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)
}
