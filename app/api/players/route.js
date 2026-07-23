import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { getFcValuesMap } from '@/lib/fcValues'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const settings = parseSettings(searchParams)

  let dbQuery = supabase
    .from('players')
    .select('id, full_name, position, team, age')
    .order('full_name', { ascending: true })
    .limit(query.length >= 1 ? 10 : 200)

  if (query.length >= 1) {
    dbQuery = dbQuery.ilike('full_name', `%${query}%`)
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fcValues = await getFcValuesMap(settings)

  const adjusted = data
    .map((p) => {
      const source = fcValues.get(String(p.id))
      if (source == null) return null // player not in FantasyCalc's current list
      return { ...p, baseValue: source, value: getAdjustedValue(source, p, settings) }
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)
    .slice(0, query.length >= 1 ? 10 : 100)

  return NextResponse.json(adjusted)
}