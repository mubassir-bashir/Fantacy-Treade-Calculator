// app/api/sleeper/rosters/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')

  if (!leagueId) {
    return NextResponse.json({ error: 'leagueId is required' }, { status: 400 })
  }

  // Get rosters (player IDs per team) and users (display names) in parallel
  const [rostersRes, usersRes] = await Promise.all([
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
  ])

  if (!rostersRes.ok || !usersRes.ok) {
    return NextResponse.json({ error: 'Could not fetch league data' }, { status: 500 })
  }

  const rosters = await rostersRes.json()
  const users = await usersRes.json()

  const userMap = {}
  users.forEach((u) => {
    userMap[u.user_id] = u.display_name
  })

  // Collect every player ID across all rosters
  const allPlayerIds = rosters.flatMap((r) => r.players || [])

  const { data: playerData, error } = await supabase
    .from('players')
    .select('id, full_name, position, team, age, value')
    .in('id', allPlayerIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const playerMap = {}
  playerData.forEach((p) => {
    playerMap[p.id] = p
  })

  const teams = rosters.map((r) => ({
    ownerId: r.owner_id,
    teamName: userMap[r.owner_id] || 'Unknown Team',
    players: (r.players || []).map((id) => playerMap[id]).filter(Boolean),
  }))

  return NextResponse.json(teams)
}