// scripts/updateValues.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function updateValues() {
  console.log('Sleeper 2025 season stats fetching ...')
  const res = await fetch('https://api.sleeper.app/v1/stats/nfl/regular/2025')
  const stats = await res.json()

  console.log('Getting player from database...')
  let players = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error: fetchError } = await supabase
      .from('players')
      .select('id, position, value')
      .range(from, from + pageSize - 1)

    if (fetchError) {
      console.error('Players fetch error:', fetchError)
      return
    }

    players = players.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`${players.length} players ke values calculate ho rahe hain...`)

  // QBs naturally rack up more raw points, so they get a lower multiplier —
    // this reflects real market scarcity where RB/WR/TE are harder to replace
    function getMultiplier(position) {
      return position === 'QB' ? 20 : 30
    }

    const updates = players.map((player) => {
      const playerStats = stats[player.id]
      const points = playerStats?.pts_ppr || 0
      const value = Math.round(points * getMultiplier(player.position)) + 100
      return { id: player.id, value }
    })

  // Pehle current values ko history me save karo (naya update karne se pehle)
  console.log('Old values storing in history...')
  const historyRows = players
    .map((p) => {
      const current = updates.find((u) => u.id === p.id)
      return current ? { player_id: p.id, value: p.value } : null
    })
    .filter(Boolean)

  const historyBatchSize = 500
  for (let i = 0; i < historyRows.length; i += historyBatchSize) {
    const batch = historyRows.slice(i, i + historyBatchSize)
    const { error } = await supabase.from('value_history').insert(batch)
    if (error) console.error('History save error:', error)
  }
  console.log('History saved ')

  // Ab naya value update karo
  let successCount = 0
  let errorCount = 0

  for (const update of updates) {
    const { error } = await supabase
      .from('players')
      .update({ value: update.value })
      .eq('id', update.id)

    if (error) {
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`${successCount} players update hue, ${errorCount} errors aayi`)
  console.log('Values Updated')
}

updateValues()