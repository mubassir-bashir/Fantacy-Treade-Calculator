// app/players/[id]/page.js
'use client'
import Logo from '../../components/Logo'

import { useState, useEffect, use } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PlayerDetail({ params }) {
  const { id } = use(params)
  const [player, setPlayer] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayer(data.player)
        setHistory(
          data.history.map((h) => ({
            date: new Date(h.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: h.value,
          }))
        )
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (!player) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Player not found</div>
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1D29]">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo />
          <a href="/rankings" className="text-sm text-blue-600 hover:underline">← Back to Rankings</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">{player.full_name}</h1>
          <span className="text-2xl font-bold">{player.value.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          {player.position} · {player.team} · Age {player.age ?? '—'}
        </p>

        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-4">Value History</h3>
          {history.length < 2 ? (
            <p className="text-sm text-gray-400">
              Not enough history yet — check back after a few value updates.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}