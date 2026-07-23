import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { getFcValuesMap } from '@/lib/fcValues'
import { NextResponse } from 'next/server'

// Never let Next.js statically cache/reuse this route's output across
// different query params (mode/superflex/leagueSize/etc all change the result).
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 1000

// Supabase/PostgREST caps rows at 1000 per request by default.
// Loop through pages until a page comes back smaller than PAGE_SIZE.
async function fetchAllPlayers(position) {
  let all = []
  let from = 0

  while (true) {
    let dbQuery = supabase
      .from('players')
      .select('id, full_name, position, team, age')
      .range(from, from + PAGE_SIZE - 1)

    if (position !== 'ALL') {
      dbQuery = dbQuery.eq('position', position)
    }

    const { data, error } = await dbQuery

    if (error) throw error
    if (!data || data.length === 0) break

    all = all.concat(data)

    if (data.length < PAGE_SIZE) break // last page reached
    from += PAGE_SIZE
  }

  return all
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const settings = parseSettings(searchParams)
  const position = searchParams.get('position') || 'ALL'

  let data
  try {
    data = await fetchAllPlayers(position)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fcValues = await getFcValuesMap(settings)

  const ranked = data
    .map((p) => {
      const source = fcValues.get(String(p.id))
      if (source == null) return null
      return { ...p, baseValue: source, value: getAdjustedValue(source, p, settings) }
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  return NextResponse.json(ranked)
}