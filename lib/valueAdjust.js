// lib/valueAdjust.js

// Adjusts a player's base value based on league settings.
// Base value stays untouched in the database — this is a runtime adjustment layer.
export function getAdjustedValue(baseValue, player, settings) {
  if (player.position === 'PICK') {
    return Math.round(baseValue)
  }
  
  let value = baseValue



  const { mode, superflex, tep, ppr, leagueSize } = settings

  // Dynasty: younger players are worth more (long-term value), older players worth less
  if (mode === 'dynasty' && player.age) {
    const age = player.age
    let ageMultiplier = 1
    if (age <= 23) ageMultiplier = 1.3
    else if (age <= 26) ageMultiplier = 1.15
    else if (age <= 29) ageMultiplier = 1.0
    else if (age <= 32) ageMultiplier = 0.75
    else ageMultiplier = 0.5
    value *= ageMultiplier
  }

  // Superflex: QBs become much more valuable since two can start at once
  if (superflex && player.position === 'QB') {
    value *= 1.8
  }

  // Tight End Premium: boosts TE values
  if (player.position === 'TE') {
    if (tep === '0.5') value *= 1.15
    else if (tep === '1') value *= 1.3
  }

  // PPR: favors pass-catching WRs; standard scoring favors bell-cow RBs
  if (player.position === 'WR') {
    if (ppr === 0) value *= 0.85
    else if (ppr === 1) value *= 1.1
  } else if (player.position === 'RB') {
    if (ppr === 0) value *= 1.1
    else if (ppr === 1) value *= 0.95
  }

  // League size: deeper leagues slightly raise the value of role players
  const sizeDelta = (leagueSize - 12) * 0.01
  value *= (1 + sizeDelta)

  return Math.round(value)
}

// Reads league settings out of a request's query params, with sensible defaults
export function parseSettings(searchParams) {
  return {
    mode: searchParams.get('mode') || 'redraft',
    superflex: searchParams.get('superflex') === 'true',
    tep: searchParams.get('tep') || 'Off',
    ppr: Number(searchParams.get('ppr') ?? 1),
    leagueSize: Number(searchParams.get('leagueSize') ?? 12),
  }
}