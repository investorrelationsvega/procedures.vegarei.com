import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadIndex, CATEGORIES, COMPANIES, REVIEW_CADENCES, getReviewStatus } from '../lib/drive'
import { MOCK_INDEX } from '../lib/mockData'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function ReviewDashboard() {
  const { token, user, isAuthed } = useAuth()
  const [index, setIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'overdue' | 'due-soon' | 'on-track'
  const [ownerFilter, setOwnerFilter] = useState('all') // 'all' | 'mine' | specific name
  const [companyFilter, setCompanyFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let idx = MOCK_INDEX
        if (import.meta.env.VITE_DRIVE_INDEX_FILE_ID && token) {
          idx = await loadIndex(token)
        }
        setIndex(idx)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const sops = useMemo(() => {
    if (!index?.sops) return []
    return index.sops
      .filter(s => s.status !== 'archived')
      .map(s => ({
        ...s,
        reviewStatus: getReviewStatus(s.lastReviewed, s.reviewCadence),
        cadence: REVIEW_CADENCES[s.reviewCadence],
        cat: CATEGORIES[s.category],
        comp: COMPANIES[s.company],
        nextReview: getNextReviewDate(s.lastReviewed, s.reviewCadence),
      }))
      .sort((a, b) => {
        // Sort: overdue first, then due-soon, then on-track
        const order = { overdue: 0, 'due-soon': 1, 'on-track': 2 }
        const diff = (order[a.reviewStatus] || 2) - (order[b.reviewStatus] || 2)
        if (diff !== 0) return diff
        // Then by next review date (soonest first)
        return (a.nextReview || Infinity) - (b.nextReview || Infinity)
      })
  }, [index])

  const filteredSops = useMemo(() => {
    return sops.filter(s => {
      if (filter !== 'all' && s.reviewStatus !== filter) return false
      if (companyFilter !== 'all' && s.company !== companyFilter) return false
      if (ownerFilter === 'mine' && user?.email) {
        const ownerLower = (s.owner || '').toLowerCase()
        const emailPrefix = user.email.split('@')[0].toLowerCase()
        const userName = (user.name || '').toLowerCase()
        if (!ownerLower.includes(emailPrefix) && !ownerLower.includes(userName)) return false
      } else if (ownerFilter !== 'all' && ownerFilter !== 'mine') {
        if ((s.owner || '').toLowerCase() !== ownerFilter.toLowerCase()) return false
      }
      return true
    })
  }, [sops, filter, ownerFilter, companyFilter, user])

  const owners = useMemo(() => {
    const set = new Set(sops.map(s => s.owner).filter(Boolean))
    return [...set].sort()
  }, [sops])

  const companies = useMemo(() => {
    const set = new Set(sops.map(s => s.company).filter(Boolean))
    return [...set].sort()
  }, [sops])

  const counts = useMemo(() => ({
    total: sops.length,
    overdue: sops.filter(s => s.reviewStatus === 'overdue').length,
    dueSoon: sops.filter(s => s.reviewStatus === 'due-soon').length,
    onTrack: sops.filter(s => s.reviewStatus === 'on-track').length,
  }), [sops])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/" className="text-xs font-mono text-[#797469] hover:text-black transition-colors">
                Procedures
              </Link>
              <span className="text-xs text-[#797469]">&rsaquo;</span>
              <span className="text-xs font-mono text-black font-bold">Review Calendar</span>
            </div>
            <h1 className="text-lg font-bold text-[#111]">SOP Review Calendar</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-12">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading...</span>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <SummaryCard
                label="Total Active"
                count={counts.total}
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <SummaryCard
                label="Overdue"
                count={counts.overdue}
                color="#ef4444"
                active={filter === 'overdue'}
                onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
              />
              <SummaryCard
                label="Due Soon"
                count={counts.dueSoon}
                color="#f59e0b"
                active={filter === 'due-soon'}
                onClick={() => setFilter(filter === 'due-soon' ? 'all' : 'due-soon')}
              />
              <SummaryCard
                label="On Track"
                count={counts.onTrack}
                color="#22c55e"
                active={filter === 'on-track'}
                onClick={() => setFilter(filter === 'on-track' ? 'all' : 'on-track')}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span style={mono} className="text-[9px] uppercase tracking-wider text-[#797469]">Owner:</span>
                <select
                  value={ownerFilter}
                  onChange={e => setOwnerFilter(e.target.value)}
                  className="text-xs font-mono border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-black"
                >
                  <option value="all">All</option>
                  {isAuthed && <option value="mine">My SOPs</option>}
                  {owners.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span style={mono} className="text-[9px] uppercase tracking-wider text-[#797469]">Business Unit:</span>
                <select
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                  className="text-xs font-mono border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-black"
                >
                  <option value="all">All</option>
                  {companies.map(c => (
                    <option key={c} value={c}>{COMPANIES[c]?.label || c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SOP list */}
            {filteredSops.length === 0 ? (
              <p className="text-sm text-gray-400 py-8">No SOPs match these filters.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">Status</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">SOP ID</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">Title</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">Owner</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">Last Reviewed</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2 pr-3">Next Review</th>
                    <th style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] text-left py-2">Cadence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSops.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-3">
                        <StatusBadge status={s.reviewStatus} />
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          to={`/sop/${s.id}`}
                          className="font-mono text-xs text-[#27474D] font-bold hover:underline"
                        >
                          {s.id}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-[#111]">
                        <Link to={`/sop/${s.id}`} className="hover:underline">
                          {s.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-[#797469] text-xs">{s.owner || '-'}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-[#797469]">{s.lastReviewed || '-'}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-[#797469]">
                        {s.nextReview ? new Date(s.nextReview).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-3 font-mono text-xs text-[#797469]">{s.cadence?.label || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-3 text-left transition-colors ${
        active ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <div style={mono} className="text-[9px] uppercase tracking-wider text-[#797469] mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || '#111' }}>{count}</div>
    </button>
  )
}

function StatusBadge({ status }) {
  const config = {
    overdue: { label: 'Overdue', bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
    'due-soon': { label: 'Due Soon', bg: '#fffbeb', color: '#f59e0b', border: '#fde68a' },
    'on-track': { label: 'On Track', bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0' },
  }
  const c = config[status] || config['on-track']
  return (
    <span
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
    >
      {c.label}
    </span>
  )
}

function getNextReviewDate(lastReviewed, cadence) {
  if (!lastReviewed || !cadence || cadence === 'as-needed') return null
  const config = REVIEW_CADENCES[cadence]
  if (!config?.days) return null
  const last = new Date(lastReviewed)
  const next = new Date(last.getTime() + config.days * 24 * 60 * 60 * 1000)
  return next.getTime()
}
