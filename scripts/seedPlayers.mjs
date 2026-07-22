import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seedPlayers() {
  console.log('Sleeper se players fetch ho rahe hain...')
  const res = await fetch('https://api.sleeper.app/v1/players/nfl')
  const allPlayers = await res.json()

  // Sirf relevant fantasy positions rakho, aur active players
  const relevantPositions = ['QB', 'RB', 'WR', 'TE']
  const filtered = Object.values(allPlayers).filter(
    (p) =>
      p.active &&
      relevantPositions.includes(p.position) &&
      p.full_name
  )

  console.log(`${filtered.length} players mile, database me daal rahe hain...`)

  // Batches me insert karo (Supabase ek sath bohot zyada rows nahi leta)
  const batchSize = 500
  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize).map((p) => ({
      id: p.player_id,
      full_name: p.full_name,
      position: p.position,
      team: p.team || 'FA',
      age: p.age || null,
      value: 5000, // sab ki starting value same rakhte hain abhi
    }))

    const { error } = await supabase.from('players').upsert(batch)
    if (error) console.error('Error:', error)
    else console.log(`Batch ${i / batchSize + 1} done`)
  }

  console.log('Sab players daal diye gaye! ✅')
}

seedPlayers()