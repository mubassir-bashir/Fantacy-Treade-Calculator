// app/api/cron/update-values/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  // Only Vercel's cron scheduler (or someone with the secret) can trigger this
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch current season stats from Sleeper
    const statsRes = await fetch('https://api.sleeper.app/v1/stats/nfl/regular/2025')
    const stats = await statsRes.json()

    // Fetch all players from our database (paginated, since Supabase caps at 1000 per request)
    let players = []
    let from = 0
    const pageSize = 1000
    while (true) {
      const { data, error } = await supabase
        .from('players')
        .select('id, position, value')
        .range(from, from + pageSize - 1)

      if (error) throw new Error(error.message)
      players = players.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }

    function getMultiplier(position) {
      return position === 'QB' ? 20 : 30
    }

    const updates = players.map((player) => {
      const playerStats = stats[player.id]
      const points = playerStats?.pts_ppr || 0
      const value = Math.round(points * getMultiplier(player.position)) + 100
      return { id: player.id, value }
    })

    // Save current values to history before overwriting them
    const historyRows = players.map((p) => ({ player_id: p.id, value: p.value }))
    const historyBatchSize = 500
    for (let i = 0; i < historyRows.length; i += historyBatchSize) {
      const batch = historyRows.slice(i, i + historyBatchSize)
      await supabase.from('value_history').insert(batch)
    }

    // Apply the new values
    let successCount = 0
    for (const update of updates) {
      const { error } = await supabase.from('players').update({ value: update.value }).eq('id', update.id)
      if (!error) successCount++
    }

    return NextResponse.json({ success: true, updated: successCount, total: players.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}