// app/api/equalize/route.js
import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const gap = Number(searchParams.get('gap')) || 0
  const excludeIds = (searchParams.get('exclude') || '').split(',').filter(Boolean)
  const settings = parseSettings(searchParams)

  if (gap <= 0) {
    return NextResponse.json([])
  }

  // Cast a wide net on the raw value since adjustments can shift things up to ~1.8x
  const minValue = gap * 0.4
  const maxValue = gap * 2.2

  let query = supabase
    .from('players')
    .select('id, full_name, position, team, age, value')
    .gte('value', minValue)
    .lte('value', maxValue)
    .limit(200)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const adjusted = data
    .map((p) => ({ ...p, baseValue: p.value, value: getAdjustedValue(p.value, p, settings) }))
    .filter((p) => p.value >= gap * 0.85 && p.value <= gap * 1.15)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return NextResponse.json(adjusted)
}