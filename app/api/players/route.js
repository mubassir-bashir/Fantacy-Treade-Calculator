// app/api/players/route.js
import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const settings = parseSettings(searchParams)

  let dbQuery = supabase
    .from('players')
    .select('id, full_name, position, team, age, value')
    .order('value', { ascending: false })
    .limit(query.length >= 1 ? 10 : 100)

  // If there's a search query, filter by name — otherwise show top players by value
  if (query.length >= 1) {
    dbQuery = dbQuery.ilike('full_name', `%${query}%`)
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, full_name, position, team, age, value, dynasty_value')
    .ilike('full_name', `%${query}%`)
    .order('value', { ascending: false })
    .limit(query.length >= 1 ? 10 : 100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const adjusted = data.map((p) => {
    const source = settings.mode === 'dynasty' ? p.dynasty_value : p.value
    return { ...p, baseValue: source, value: getAdjustedValue(source, p, settings) }
  })

  return NextResponse.json(adjusted)
}