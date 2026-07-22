// app/api/sleeper/leagues/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const season = searchParams.get('season') || '2026'

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const res = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`, {
  cache: 'no-store'
})

  if (!res.ok) {
    return NextResponse.json({ error: 'Could not fetch leagues' }, { status: 500 })
  }

  const leagues = await res.json()
  const simplified = leagues.map((l) => ({ leagueId: l.league_id, name: l.name }))

  return NextResponse.json(simplified)
}