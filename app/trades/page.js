// app/trades/page.js
'use client'
import Logo from '../components/Logo'

import { useState, useEffect } from 'react'

export default function TradeDatabase() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trades')
      .then((res) => res.json())
      .then((data) => {
        setTrades(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#1A1D29]">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <a href="/rankings" className="text-sm text-blue-600 hover:underline">Rankings</a>
            <a href="/trade-calculator" className="text-sm text-blue-600 hover:underline">← Back to Calculator</a>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Trade Database</h1>
        <p className="text-sm text-gray-500 mb-8">Recently saved trades from the community.</p>

        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {!loading && trades.length === 0 && (
          <p className="text-sm text-gray-400">No trades saved yet. Be the first!</p>
        )}

        <div className="space-y-4">
          {trades.map((trade) => (
            <div key={trade.id} className="border border-gray-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Team One gets</p>
                  {trade.team1_players.map((p) => (
                    <p key={p.id} className="text-sm">{p.full_name}</p>
                  ))}
                  <p className="text-sm font-semibold mt-2">{trade.team1_total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Team Two gets</p>
                  {trade.team2_players.map((p) => (
                    <p key={p.id} className="text-sm">{p.full_name}</p>
                  ))}
                  <p className="text-sm font-semibold mt-2">{trade.team2_total.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                {new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}