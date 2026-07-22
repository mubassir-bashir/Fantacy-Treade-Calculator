// app/trade-calculator/page.js
'use client'
import Logo from '../components/Logo'
import { useState, useEffect, useRef } from 'react'
import { getAdjustedValue } from '../../lib/valueAdjust'

export default function TradeCalculator() {
  const [team1, setTeam1] = useState([])
  const [team2, setTeam2] = useState([])
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [results1, setResults1] = useState([])
  const [results2, setResults2] = useState([])
  const [mode, setMode] = useState('redraft')
  const [leagueSize, setLeagueSize] = useState(12)
  const [ppr, setPpr] = useState(1)
  const [tep, setTep] = useState('Off')
  const [superflex, setSuperflex] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [notablePlayers, setNotablePlayers] = useState([])
  const [trends, setTrends] = useState({ risers: [], fallers: [] })

  const [picks, setPicks] = useState([])
  const [showPicks1, setShowPicks1] = useState(false)
  const [showPicks2, setShowPicks2] = useState(false)

  useEffect(() => {
    fetch('/api/picks')
      .then((res) => res.json())
      .then((data) => setPicks(data))
  }, [])

  useEffect(() => {
    fetch('/api/trends')
      .then((res) => res.json())
      .then((data) => setTrends(data))
  }, [])

  // Fetch a default "notable players" list, shown when no equalize suggestions are active
  useEffect(() => {
    const params = new URLSearchParams({
      q: '',
      mode,
      superflex: String(superflex),
      tep,
      ppr: String(ppr),
      leagueSize: String(leagueSize),
    })
    fetch(`/api/players?${params}`)
      .then((res) => res.json())
      .then((data) => setNotablePlayers(data.slice(0, 5)))
  }, [mode, superflex, tep, ppr, leagueSize])

  async function fetchSuggestions(gap, losingTeamIds, winningTeamIds) {
    if (gap <= 0) {
      setSuggestions([])
      return
    }
    const excludeIds = [...losingTeamIds, ...winningTeamIds].join(',')
    const params = new URLSearchParams({
      gap: String(Math.round(gap)),
      exclude: excludeIds,
      mode,
      superflex: String(superflex),
      tep,
      ppr: String(ppr),
      leagueSize: String(leagueSize),
    })
    const res = await fetch(`/api/equalize?${params}`)
    const data = await res.json()
    setSuggestions(data)
  }

  async function searchPlayers(query, setResults) {
    const params = new URLSearchParams({
      q: query,
      mode,
      superflex: String(superflex),
      tep,
      ppr: String(ppr),
      leagueSize: String(leagueSize),
    })
    const res = await fetch(`/api/players?${params}`)
    const data = await res.json()
    setResults(data)
  }

  function addPlayer(player, team, setTeam, setSearch, setResults) {
    setTeam([...team, player])
    setSearch('')
    setResults([])
  }

  function removePlayer(id, team, setTeam) {
    setTeam(team.filter((p) => p.id !== id))
  }

  const [saveStatus, setSaveStatus] = useState('idle')
  const [showSync, setShowSync] = useState(false)
  const [syncStep, setSyncStep] = useState('username')
  const [syncError, setSyncError] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [leagues, setLeagues] = useState([])
  const [rosters, setRosters] = useState([])
  const [syncedLeagueName, setSyncedLeagueName] = useState('')
  const [team1OwnerId, setTeam1OwnerId] = useState(null)
  const [team2OwnerId, setTeam2OwnerId] = useState(null)

  async function lookupUser(typedUsername) {
    if (!typedUsername) {
      setSyncError('Please type your Sleeper username before continuing.')
      return
    }
    setSyncError('')
    setSyncLoading(true)
    try {
      const userRes = await fetch(`/api/sleeper/user?username=${encodeURIComponent(typedUsername)}`)
      const userData = await userRes.json()
      if (!userRes.ok) throw new Error(userData.error)

      const leaguesRes = await fetch(`/api/sleeper/leagues?userId=${userData.userId}`)
      const leaguesData = await leaguesRes.json()
      if (!leaguesRes.ok) throw new Error(leaguesData.error)

      setLeagues(leaguesData)
      setSyncStep('leagues')
    } catch (err) {
      setSyncError(err.message || 'Something went wrong')
    }
    setSyncLoading(false)
  }

  async function loadRosters(leagueId, leagueName) {
    setSyncError('')
    setSyncLoading(true)
    try {
      const res = await fetch(`/api/sleeper/rosters?leagueId=${leagueId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRosters(data)
      setSyncedLeagueName(leagueName || '')
      setSyncStep('rosters')
    } catch (err) {
      setSyncError(err.message || 'Something went wrong')
    }
    setSyncLoading(false)
  }

  function pickTeam(team, side) {
    if (side === 1) {
      setTeam1(team.players)
      setTeam1OwnerId(team.ownerId)
    } else {
      setTeam2(team.players)
      setTeam2OwnerId(team.ownerId)
    }
    setShowSync(false)
  }

  async function saveTrade() {
    setSaveStatus('saving')
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1Players: team1, team2Players: team2, team1Total, team2Total }),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('idle')
    }
  }

  const team1Total = team1.reduce((sum, p) => sum + p.value, 0)
  const team2Total = team2.reduce((sum, p) => sum + p.value, 0)
  const hasPlayers = team1.length > 0 || team2.length > 0
  const gap = Math.abs(team1Total - team2Total)
  const grandTotal = team1Total + team2Total
  const gapPct = grandTotal === 0 ? 0 : Math.round((gap / grandTotal) * 100)

  useEffect(() => {
    if (gapPct >= 5 && hasPlayers) {
      const losingIds = team1Total < team2Total ? team1.map((p) => p.id) : team2.map((p) => p.id)
      const winningIds = team1Total < team2Total ? team2.map((p) => p.id) : team1.map((p) => p.id)
      fetchSuggestions(gap, losingIds, winningIds)
    } else {
      setSuggestions([])
    }
  }, [team1, team2])

  useEffect(() => {
    const settings = { mode, superflex, tep, ppr, leagueSize }
    setTeam1((prev) => prev.map((p) => ({ ...p, value: getAdjustedValue(p.baseValue ?? p.value, p, settings) })))
    setTeam2((prev) => prev.map((p) => ({ ...p, value: getAdjustedValue(p.baseValue ?? p.value, p, settings) })))
  }, [mode, superflex, tep, ppr, leagueSize])

  let verdict = null
  if (hasPlayers && gapPct >= 5) {
    verdict = team1Total > team2Total ? 'Team One is winning this trade' : 'Team Two is winning this trade'
  } else if (hasPlayers) {
    verdict = 'This trade is fair'
  }

  // Show equalize suggestions if a trade is unbalanced, otherwise fall back to notable players
  const bottomPanelTitle = suggestions.length > 0 ? 'Players to Equalize Trade' : 'Players to Equalize Trade'
  const bottomPanelList = suggestions.length > 0 ? suggestions : notablePlayers

  return (
    <div className="min-h-screen bg-white text-[#1A1D29]">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSync(true)}
              className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sync League
            </button>
            <a href="/trades" className="text-sm text-blue-600 hover:underline">Trade History</a>
            <a href="/rankings" className="text-sm text-blue-600 hover:underline">Rankings →</a>
          </div>
        </div>
      </div>

      {showSync && (
        <SyncModal
          syncStep={syncStep}
          onLookup={lookupUser}
          loading={syncLoading}
          error={syncError}
          leagues={leagues}
          onSelectLeague={loadRosters}
          rosters={rosters}
          onPickTeam={pickTeam}
          onClose={() => setShowSync(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fantasy Football Trade Calculator</h1>
            <p className="text-sm text-gray-500 mt-1">Values generated from real player performance data.</p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('redraft')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'redraft' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
            >
              Redraft
            </button>
            <button
              onClick={() => setMode('dynasty')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'dynasty' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
            >
              Dynasty
            </button>
          </div>

          <div className="flex items-center gap-4">
            <SettingField label="League Size" value={leagueSize} onChange={setLeagueSize} options={[8, 10, 12, 14, 16]} />
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

        {/* Main layout: left content (2/3) + sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Calculator card */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TeamPanel
                  label="Team One"
                  search={search1}
                  results={results1}
                  picks={picks}
                  showPicks={showPicks1}
                  setShowPicks={setShowPicks1}
                  onSearch={(v) => { setSearch1(v); searchPlayers(v, setResults1) }}
                  onCloseResults={() => setResults1([])}
                  team={team1}
                  onAdd={(p) => addPlayer(p, team1, setTeam1, setSearch1, setResults1)}
                  onRemove={(id) => removePlayer(id, team1, setTeam1)}
                  total={team1Total}
                />
                <TeamPanel
                  label="Team Two"
                  search={search2}
                  results={results2}
                  picks={picks}
                  showPicks={showPicks2}
                  setShowPicks={setShowPicks2}
                  onSearch={(v) => { setSearch2(v); searchPlayers(v, setResults2) }}
                  onCloseResults={() => setResults2([])}
                  team={team2}
                  onAdd={(p) => addPlayer(p, team2, setTeam2, setSearch2, setResults2)}
                  onRemove={(id) => removePlayer(id, team2, setTeam2)}
                  total={team2Total}
                />
              </div>

              <div className="mt-6">
                {!hasPlayers && (
                  <div className="bg-blue-50 text-blue-700 text-sm font-medium rounded-lg px-4 py-3 text-center">
                    Add players to both sides to get started
                  </div>
                )}
                {hasPlayers && verdict === 'This trade is fair' && (
                  <div className="bg-green-50 text-green-700 text-sm font-medium rounded-lg px-4 py-3 text-center">{verdict}</div>
                )}
                {hasPlayers && verdict && verdict !== 'This trade is fair' && (
                  <div className="bg-amber-50 text-amber-700 text-sm font-medium rounded-lg px-4 py-3 text-center">
                    {verdict} <span className="text-amber-500">· {gapPct}% gap</span>
                  </div>
                )}
              </div>

              {hasPlayers && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={saveTrade}
                    disabled={saveStatus === 'saving'}
                    className="text-sm font-medium bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : 'Save This Trade'}
                  </button>
                </div>
              )}
            </div>

            {/* Players to Equalize / Notable Players panel — separate box, always visible */}
            {bottomPanelList.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-sm mb-3">{bottomPanelTitle}</h3>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-gray-400 pb-2 border-b border-gray-100">
                  <span>Player</span>
                  <span>Age</span>
                  <span>Value</span>
                  <span></span>
                </div>
                {bottomPanelList.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-2.5 border-b border-gray-100 text-sm last:border-0"
                  >
                    <span>
                      <span className="font-medium text-blue-600">{p.full_name}</span>{' '}
                      <span className="text-gray-400 text-xs">{p.position}</span>
                    </span>
                    <span className="text-gray-500 text-xs">{p.age ?? '—'}</span>
                    <span className="font-semibold">{p.value.toLocaleString()}</span>
                    <button
                      onClick={() => {
                        if (team1Total <= team2Total) setTeam1([...team1, p])
                        else setTeam2([...team2, p])
                      }}
                      className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors justify-self-end"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-xl p-6">
              {rosters.length === 0 ? (
                <>
                  <h3 className="font-semibold text-base mb-2">Sync Your League</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Connect your Sleeper league to load real rosters straight into the calculator — no manual searching required.
                  </p>
                  <button
                    onClick={() => setShowSync(true)}
                    className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sync League
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-base mb-1">{syncedLeagueName || 'Synced League'}</h3>
                  <p className="text-xs text-gray-400 mb-3">{rosters.length} teams · click to load into calculator</p>
                  <div className="space-y-1 mb-4">
                    {rosters.map((team) => (
                      <div key={team.ownerId} className="flex items-center justify-between text-sm py-1">
                        <span className="truncate">{team.teamName}</span>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => pickTeam(team, 1)}
                            className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                              team1OwnerId === team.ownerId ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            One
                          </button>
                          <button
                            onClick={() => pickTeam(team, 2)}
                            className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                              team2OwnerId === team.ownerId ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            Two
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowSync(true)}
                    className="w-full text-sm font-medium text-blue-600 hover:underline"
                  >
                    Sync Another League
                  </button>
                </>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-base mb-3">Trends</h3>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Top Risers (14d)</p>
              {trends.risers.length === 0 && (
                <p className="text-xs text-gray-400 mb-4">Not enough data yet — check back soon.</p>
              )}
              {trends.risers.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-1.5 text-sm">
                  <span className="text-blue-600 font-medium">{p.full_name}</span>
                  <span className="text-green-600 font-semibold">+{p.change.toLocaleString()}</span>
                </div>
              ))}

              <p className="text-xs text-gray-400 uppercase tracking-wide mt-4 mb-2">Top Fallers (14d)</p>
              {trends.fallers.length === 0 && (
                <p className="text-xs text-gray-400">Not enough data yet — check back soon.</p>
              )}
              {trends.fallers.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-1.5 text-sm">
                  <span className="text-blue-600 font-medium">{p.full_name}</span>
                  <span className="text-red-600 font-semibold">{p.change.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamPanel({ label, search, onSearch, onCloseResults, results, team, onAdd, onRemove, total, picks, showPicks, setShowPicks }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base">{label}</h2>
        <button onClick={() => setShowPicks(!showPicks)} className="text-xs font-medium text-blue-600 hover:underline">
          + Pick
        </button>
      </div>

      {showPicks && (
        <div className="border border-gray-200 rounded-lg mb-3 max-h-40 overflow-y-auto">
          {picks.map((pick) => (
            <div
              key={pick.id}
              onMouseDown={(e) => {
                e.preventDefault()
                onAdd({ id: pick.id, full_name: pick.label, position: 'PICK', team: '', age: null, value: pick.value, baseValue: pick.value })
                setShowPicks(false)
              }}
              className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center text-sm border-b border-gray-100 last:border-0"
            >
              <span>{pick.label}</span>
              <span className="text-gray-500 text-xs">{pick.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => onSearch(search)}
          onBlur={() => setTimeout(onCloseResults, 150)}
          placeholder="Search for player"
          className="w-full border border-gray-300 rounded-lg pl-4 pr-9 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {results.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg overflow-y-auto max-h-64">
            {results.map((p) => (
              <div
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); onAdd(p) }}
                className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 flex justify-between items-center text-sm border-b border-gray-100 last:border-0"
              >
                <span>
                  <span className="font-medium text-blue-600">{p.full_name}</span>{' '}
                  <span className="text-gray-400 text-xs">{p.position} · {p.team}</span>
                </span>
                <span className="text-gray-500 text-xs">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {team.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs text-gray-400 pb-2 border-b border-gray-100">
            <span>Player</span><span>Age</span><span>Value</span><span></span>
          </div>
          {team.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-2.5 border-b border-gray-100 text-sm">
              <span>
                <span className="font-medium text-blue-600">{p.full_name}</span>{' '}
                <span className="text-gray-400 text-xs">{p.position === 'PICK' ? 'Draft Pick' : p.position}</span>
              </span>
              <span className="text-gray-500 text-xs">{p.position === 'PICK' ? '—' : (p.age ?? '—')}</span>
              <span className="font-medium">{p.value.toLocaleString()}</span>
              <button onClick={() => onRemove(p.id)} className="text-gray-300 hover:text-red-500 transition-colors w-5">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">Total Value</span>
        <span className="text-xl font-bold">{total.toLocaleString()}</span>
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

function SyncModal({ syncStep, onLookup, loading, error, leagues, onSelectLeague, rosters, onPickTeam, onClose }) {
  const typedValueRef = useRef('')

  function handleContinue() {
    onLookup(typedValueRef.current.trim())
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleContinue()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Sync Your Sleeper League</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {syncStep === 'username' && (
          <div>
            <label className="text-sm text-gray-600 block mb-2">Enter your Sleeper username</label>
            <input
              type="text"
              name="sleeper-lookup-field"
              placeholder="e.g. mubussir"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              onInput={(e) => { typedValueRef.current = e.target.value }}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 mb-1"
            />
            <p className="text-xs text-gray-400 mb-3">Tip: press Enter after typing, or click Continue.</p>
            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </div>
        )}

        {syncStep === 'leagues' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Select a league</p>
            {leagues.length === 0 && <p className="text-sm text-gray-400">No leagues found for this season.</p>}
            {leagues.map((l) => (
              <div key={l.leagueId} onClick={() => onSelectLeague(l.leagueId, l.name)} className="px-3 py-2.5 border border-gray-200 rounded-lg mb-2 cursor-pointer hover:bg-gray-50 text-sm">
                {l.name}
              </div>
            ))}
          </div>
        )}

        {syncStep === 'rosters' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Pick a team for each side</p>
            {rosters.map((team) => (
              <div key={team.ownerId} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 mb-2">
                <span className="text-sm font-medium">{team.teamName}</span>
                <div className="flex gap-2">
                  <button onClick={() => onPickTeam(team, 1)} className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200">Team One</button>
                  <button onClick={() => onPickTeam(team, 2)} className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200">Team Two</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}