// app/api/cron/sync-fantasycalc/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const DYNASTY_OPTIONS = [false, true]
const NUM_QBS_OPTIONS = [1, 2]
const NUM_TEAMS_OPTIONS = [8, 10, 12, 14, 16]
const PPR_OPTIONS = [0, 0.5, 1]

async function fetchCombo(isDynasty, numQbs, numTeams, ppr) {
  const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=${numTeams}&ppr=${ppr}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = []
  let skipped = 0

  for (const isDynasty of DYNASTY_OPTIONS) {
    for (const numQbs of NUM_QBS_OPTIONS) {
      for (const numTeams of NUM_TEAMS_OPTIONS) {
        for (const ppr of PPR_OPTIONS) {
          try {
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
            skipped++
          }
        }
      }
    }
  }

  const batchSize = 500
  let saved = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('fc_values').upsert(batch, {
      onConflict: 'player_id,is_dynasty,num_qbs,num_teams,ppr',
    })
    if (!error) saved += batch.length
  }

  return NextResponse.json({ success: true, rowsSaved: saved, combosSkipped: skipped })
}