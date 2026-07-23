// scripts/syncFantasyCalc.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DYNASTY_OPTIONS = [false, true]
const NUM_QBS_OPTIONS = [1, 2]
const NUM_TEAMS_OPTIONS = [8, 10, 12, 14]
const PPR_OPTIONS = [0, 0.5, 1]

async function fetchCombo(isDynasty, numQbs, numTeams, ppr) {
  const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=${numTeams}&ppr=${ppr}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FantasyCalc API failed (${res.status}) for combo ${url}`)
  return res.json()
}

async function syncAllCombos() {
  const rows = []

  for (const isDynasty of DYNASTY_OPTIONS) {
    for (const numQbs of NUM_QBS_OPTIONS) {
      for (const numTeams of NUM_TEAMS_OPTIONS) {
          for (const ppr of PPR_OPTIONS) {
            try {
              console.log(`Fetching: dynasty=${isDynasty}, qbs=${numQbs}, teams=${numTeams}, ppr=${ppr}`)
              const data = await fetchCombo(isDynasty, numQbs, numTeams, ppr)

              for (const entry of data) {
                if (entry.player?.sleeperId) {
                  rows.push({
                    player_id: entry.player.sleeperId,
                    is_dynasty: isDynasty,
                    num_qbs: numQbs,
                    num_teams: numTeams,
                    ppr: ppr,
                    value: entry.value,
                  })
                }
              }
            } catch (err) {
              console.log(`Skipped combo (not supported): teams=${numTeams}, ppr=${ppr} — ${err.message}`)
            }
          }
        }
    }
  }

  console.log(`Saving ${rows.length} rows to fc_values...`)
  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('fc_values').upsert(batch, {
      onConflict: 'player_id,is_dynasty,num_qbs,num_teams,ppr',
    })
    if (error) console.error('Save error:', error)
  }

  console.log('Done syncing all FantasyCalc combinations!')
}

syncAllCombos()