// app/rankings/page.js
'use client'
import Logo from '../components/Logo'

import { useState, useEffect } from 'react'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']

export default function Rankings() {
  const [players, setPlayers] = useState([])
  const [position, setPosition] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/rankings?position=${position}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data)
        setLoading(false)
      })
  }, [position])

  return (
    <div className="min-h-screen bg-white text-[#1A1D29]">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <a href="/trades" className="text-sm text-blue-600 hover:underline">Trade History</a>
            <a href="/trade-calculator" className="text-sm text-blue-600 hover:underline">Trade Calculator →</a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Player Rankings</h1>
        <p className="text-sm text-gray-500 mb-6">Values generated from real player performance data.</p>

        {/* Position tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                position === pos ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-gray-50 text-xs text-gray-400 font-medium">
            <span>#</span>
            <span>Player</span>
            <span>Team</span>
            <span>Age</span>
            <span>Value</span>
          </div>

          {loading && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
          )}

          {!loading && players.map((p, i) => (
            <div
              key={p.id}
              className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-4 px-4 py-3 border-t border-gray-100 items-center text-sm hover:bg-gray-50"
            >
              <span className="text-gray-400">{i + 1}</span>
              <span>
                <a href={`/players/${p.id}`} className="font-medium text-blue-600 hover:underline">{p.full_name}</a>{' '}
                <span className="text-gray-400 text-xs">{p.position}</span>
              </span>
              <span className="text-gray-500 text-xs">{p.team}</span>
              <span className="text-gray-500 text-xs">{p.age ?? '—'}</span>
              <span className="font-semibold">{p.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}