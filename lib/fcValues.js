import { supabase } from '@/lib/supabase'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

function cacheKeyFor(settings) {
  const isDynasty = settings.mode === 'dynasty' ? 1 : 0
  const numQbs = settings.superflex ? 2 : 1
  return `${isDynasty}-${numQbs}-${settings.leagueSize}-${settings.ppr}`
}

async function fetchFromFantasyCalc(settings) {
  const isDynasty = settings.mode === 'dynasty'
  const numQbs = settings.superflex ? 2 : 1
  const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=${settings.leagueSize}&ppr=${settings.ppr}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`FantasyCalc API failed (${res.status})`)
  return res.json()
}

// Returns a Map of sleeperId -> value, live from FantasyCalc, with a 6h Supabase cache.
export async function getFcValuesMap(settings) {
  const key = cacheKeyFor(settings)

  const { data: cached, error: cacheReadError } = await supabase
    .from('fc_cache')
    .select('data, fetched_at')
    .eq('cache_key', key)
    .maybeSingle()

  if (cacheReadError) {
    console.error('fc_cache read error:', cacheReadError.message)
  }

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS

  let raw
  if (isFresh) {
    raw = cached.data
  } else {
    raw = await fetchFromFantasyCalc(settings)
    const { error: cacheWriteError } = await supabase.from('fc_cache').upsert({
      cache_key: key,
      data: raw,
      fetched_at: new Date().toISOString(),
    })
    if (cacheWriteError) {
      console.error('fc_cache write error:', cacheWriteError.message)
    }
  }

  const map = new Map()
  for (const entry of raw) {
    if (entry.player?.sleeperId) {
      map.set(String(entry.player.sleeperId), entry.value)
    }
  }
  return map
}