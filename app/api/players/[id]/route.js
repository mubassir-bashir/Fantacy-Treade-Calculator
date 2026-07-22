// app/api/players/[id]/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (playerError) {
    return NextResponse.json({ error: playerError.message }, { status: 404 })
  }

  const { data: history, error: historyError } = await supabase
    .from('value_history')
    .select('value, recorded_at')
    .eq('player_id', id)
    .order('recorded_at', { ascending: true })

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  return NextResponse.json({ player, history })
}