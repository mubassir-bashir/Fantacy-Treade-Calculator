// scripts/seedPicks.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Base value by round (earlier round = higher value)
const ROUND_BASE_VALUE = {
  1: 8000,
  2: 4000,
  3: 2000,
  4: 800,
}

// Future years get a slight discount for uncertainty
const YEAR_DISCOUNT = {
  2026: 1.0,
  2027: 0.9,
  2028: 0.8,
  2029: 0.7,
}

function ordinal(n) {
  const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' }
  return suffixes[n] || 'th'
}

async function seedPicks() {
  const rows = []

  for (const year of Object.keys(YEAR_DISCOUNT)) {
    for (const round of Object.keys(ROUND_BASE_VALUE)) {
      const base = ROUND_BASE_VALUE[round]
      const discount = YEAR_DISCOUNT[year]
      const value = Math.round(base * discount)

      rows.push({
        id: `${year}-${round}`,
        year: Number(year),
        round: Number(round),
        label: `${year} ${round}${ordinal(round)} Round`,
        value,
      })
    }
  }

  console.log(`Inserting ${rows.length} draft picks...`)
  const { error } = await supabase.from('picks').upsert(rows)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('All picks added successfully!')
  }
}

seedPicks()