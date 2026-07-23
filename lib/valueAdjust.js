// lib/valueAdjust.js

// Adjusts a player's FantasyCalc-sourced value based on league settings.
// The base value and dynasty_value already come from FantasyCalc's own algorithm —
// this layer only approximates settings FantasyCalc's API doesn't directly cover for us (TEP, custom league sizes).
export function getAdjustedValue(baseValue, player, settings) {
  if (player.position === 'PICK') {
    return Math.round(baseValue)
  }

  let value = baseValue
  const { superflex, tep, leagueSize } = settings

  // Superflex: QBs become much more valuable since two can start at once
  if (superflex && player.position === 'QB') {
    value *= 1.8
  }

  // Tight End Premium: boosts TE values
  if (player.position === 'TE') {
    if (tep === '0.5') value *= 1.15
    else if (tep === '1') value *= 1.3
  }

  // League size: deeper leagues slightly raise the value of role players
  const sizeDelta = (leagueSize - 12) * 0.01
  value *= (1 + sizeDelta)

  return Math.round(value)
}

export function parseSettings(searchParams) {
  return {
    mode: searchParams.get('mode') || 'redraft',
    superflex: searchParams.get('superflex') === 'true',
    tep: searchParams.get('tep') || 'Off',
    ppr: Number(searchParams.get('ppr') ?? 1),
    leagueSize: Number(searchParams.get('leagueSize') ?? 12),
  }
}