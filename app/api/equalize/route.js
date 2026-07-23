import { supabase } from '@/lib/supabase'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { getFcValuesMap } from '@/lib/fcValues'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const gap = Number(searchParams.get('gap') ?? 0)
  const excludeIds = (searchParams.get('exclude') || '')
    .split(',')
    .filter(Boolean)
  const settings = parseSettings(searchParams)

  const { data, error } = await supabase
    .from('players')
    .select('id, full_name, position, team, age')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fcValues = await getFcValuesMap(settings)

  const candidates = data
    .map((p) => {
      const source = fcValues.get(String(p.id))
      if (source == null) return null
      return { ...p, baseValue: source, value: getAdjustedValue(source, p, settings) }
    })
    .filter(Boolean)
    // exclude players already in either team
    .filter((p) => !excludeIds.includes(String(p.id)))
    // suggest players whose value is close to (but not wildly over) the gap
    .filter((p) => p.value <= gap * 1.15)
    .sort((a, b) => Math.abs(gap - b.value) - Math.abs(gap - a.value))
    .reverse()
    .slice(0, 10)

  return NextResponse.json(candidates)
}