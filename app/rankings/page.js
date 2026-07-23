// app/rankings/page.js
'use client'
import Logo from '../components/Logo'

import { useState, useEffect } from 'react'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE']

export default function Rankings() {
  const [players, setPlayers] = useState([])
  const [position, setPosition] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState('redraft')
  const [leagueSize, setLeagueSize] = useState(12)
  const [ppr, setPpr] = useState(1)
  const [tep, setTep] = useState('Off')
  const [superflex, setSuperflex] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      position,
      mode,
      superflex: String(superflex),
      tep,
      ppr: String(ppr),
      leagueSize: String(leagueSize),
    })
    fetch(`/api/rankings?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data)
        setLoading(false)
      })
  }, [position, mode, superflex, tep, ppr, leagueSize])

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

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          {/* Position tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
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

          {/* League settings — must match trade-calculator so values agree */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('redraft')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'redraft' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
              >
                Redraft
              </button>
              <button
                onClick={() => setMode('dynasty')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'dynasty' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
              >
                Dynasty
              </button>
            </div>
            <SettingField label="League Size" value={leagueSize} onChange={setLeagueSize} options={[8, 10, 12, 14]} />
            <SettingField label="PPR" value={ppr} onChange={setPpr} options={[0, 0.5, 1]} />
            <SettingField label="TEP" value={tep} onChange={setTep} options={['Off', '0.5', '1']} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSuperflex(!superflex)}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${superflex ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${superflex ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className="text-xs text-gray-500">Superflex</span>
            </div>
          </div>
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

function SettingField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(isNaN(e.target.value) ? e.target.value : Number(e.target.value))}
        className="text-sm font-medium border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-blue-500 bg-white cursor-pointer"
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}