import { getFcValuesMap } from '@/lib/fcValues'
import { getAdjustedValue, parseSettings } from '@/lib/valueAdjust'
import { NextResponse } from 'next/server'

// Given a list of player ids + current settings, returns fresh adjusted values.
// Used to re-price players already sitting in Team One / Team Two when settings change.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean)
  const settings = parseSettings(searchParams)

  if (!ids.length) return NextResponse.json({})

  try {
    const fcValues = await getFcValuesMap(settings)

    const result = {}
    for (const id of ids) {
      const source = fcValues.get(String(id))
      if (source != null) {
        result[id] = { baseValue: source, value: getAdjustedValue(source, { position: null }, settings) }
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/values error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}