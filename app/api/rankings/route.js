// app/api/rankings/route.js
import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position') || 'ALL'
  const settings = parseSettings(searchParams)

  let query = supabase
    .from('players')
    .select('id, full_name, position, team, age, value, dynasty_value')
    .order('value', { ascending: false })
    .limit(500)

  if (position !== 'ALL') {
    query = query.eq('position', position)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const adjusted = data
    .map((p) => {
      const source = settings.mode === 'dynasty' ? p.dynasty_value : p.value
      return { ...p, baseValue: source, value: getAdjustedValue(source, p, settings) }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 200)

  return NextResponse.json(adjusted)
}