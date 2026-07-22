// app/api/trades/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { team1Players, team2Players, team1Total, team2Total } = body

  const { data, error } = await supabase
    .from('trades')
    .insert({
      team1_players: team1Players,
      team2_players: team2Players,
      team1_total: team1Total,
      team2_total: team2Total,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}