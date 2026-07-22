// app/api/trends/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: history, error: historyError } = await supabase
    .from('value_history')
    .select('player_id, value, recorded_at')
    .gte('recorded_at', fourteenDaysAgo)
    .order('recorded_at', { ascending: true })

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  // Keep only the earliest recorded value per player within the last 14 days
  const earliest = {}
  for (const row of history) {
    if (!(row.player_id in earliest)) {
      earliest[row.player_id] = row.value
    }
  }

  const playerIds = Object.keys(earliest)
  if (playerIds.length === 0) {
    return NextResponse.json({ risers: [], fallers: [] })
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, full_name, position, value')
    .in('id', playerIds)

  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500 })
  }

  const changes = players
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      position: p.position,
      value: p.value,
      change: p.value - earliest[p.id],
    }))
    .filter((p) => p.change !== 0)

  const risers = [...changes].sort((a, b) => b.change - a.change).slice(0, 5)
  const fallers = [...changes].sort((a, b) => a.change - b.change).slice(0, 5)

  return NextResponse.json({ risers, fallers })
}