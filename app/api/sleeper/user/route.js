// app/api/sleeper/user/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.sleeper.app/v1/user/${username}`)
    const text = await res.text()

    // Sleeper returns an empty or "null" body (with 200 status) when the user doesn't exist
    if (!text || text === 'null') {
      return NextResponse.json({ error: 'Sleeper user not found' }, { status: 404 })
    }

    const user = JSON.parse(text)
    return NextResponse.json({ userId: user.user_id, displayName: user.display_name })
  } catch (err) {
    return NextResponse.json({ error: 'Could not reach Sleeper API' }, { status: 500 })
  }
}