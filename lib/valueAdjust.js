// Adjusts a player's FantasyCalc-sourced value based on league settings
// that FantasyCalc's own combo data (fc_values) doesn't cover — currently just TEP.
// Superflex, dynasty/redraft, and league size are now handled by exact
// lookups against fc_values (see lib/fcValues.js), not approximated here.
export function getAdjustedValue(baseValue, player, settings) {
  if (player.position === 'PICK') {
    return Math.round(baseValue)
  }

  let value = baseValue
  const { tep } = settings

  // Tight End Premium: boosts TE values (FantasyCalc doesn't model this)
  if (player.position === 'TE') {
    if (tep === '0.5') value *= 1.15
    else if (tep === '1') value *= 1.3
  }

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