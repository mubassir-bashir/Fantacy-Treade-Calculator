// scripts/updateValues.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fetchFantasyCalcValues(isDynasty) {
  const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=1&numTeams=12&ppr=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FantasyCalc API failed: ${res.status}`)
  const data = await res.json()

  // Map by sleeperId for easy lookup
  const map = {}
  for (const entry of data) {
    if (entry.player?.sleeperId) {
      map[entry.player.sleeperId] = entry.value
    }
  }
  return map
}

async function updateValues() {
  console.log('Fetching redraft values from FantasyCalc...')
  const redraftValues = await fetchFantasyCalcValues(false)

  console.log('Fetching dynasty values from FantasyCalc...')
  const dynastyValues = await fetchFantasyCalcValues(true)

  console.log('Getting players from database...')
  let players = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('id, value, dynasty_value')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    players = players.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`Saving history for ${players.length} players...`)
  const historyRows = players.map((p) => ({ player_id: p.id, value: p.value }))
  const historyBatchSize = 500
  for (let i = 0; i < historyRows.length; i += historyBatchSize) {
    const batch = historyRows.slice(i, i + historyBatchSize)
    const { error } = await supabase.from('value_history').insert(batch)
    if (error) console.error('History save error:', error)
  }

  console.log('Applying new values...')
  let matched = 0
  let unmatched = 0

  for (const player of players) {
    const newRedraftValue = redraftValues[player.id]
    const newDynastyValue = dynastyValues[player.id]

    // Only update if FantasyCalc has data for this player — otherwise leave their existing value untouched
    if (newRedraftValue !== undefined) {
      matched++
      const { error } = await supabase
        .from('players')
        .update({
          value: newRedraftValue,
          dynasty_value: newDynastyValue !== undefined ? newDynastyValue : newRedraftValue,
        })
        .eq('id', player.id)
      if (error) console.error('Update error:', error)
    } else {
      unmatched++
    }
  }

  console.log(`Done! Matched: ${matched}, Unmatched (kept old value): ${unmatched}`)
}

updateValues()