import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { loadIndex, CATEGORIES } from '../lib/drive'
import { MOCK_INDEX } from '../lib/mockData'
import SopCard from '../components/SopCard'

export default function Home() {
  const { token } = useAuth()
  const [index, setIndex] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (import.meta.env.VITE_DRIVE_INDEX_FILE_ID && token) {
          const data = await loadIndex(token)
          setIndex(data)
        } else {
          // Use mock data for local dev / unauthenticated view
          setIndex(MOCK_INDEX)
        }
      } catch (err) {
        console.error(err)
        setError('Could not load SOP library. Check Drive connection.')
        setIndex(MOCK_INDEX)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  // Group SOPs by category
  const grouped = {}
  if (index?.sops) {
    const filtered = index.sops.filter(s =>
      search === '' ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    )
    filtered.forEach(sop => {
      const key = sop.category || 'other'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(sop)
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero header */}
      <div className="border-b border-gray-200 bg-[#FDF6E5]">
        <div className="max-w-screen-xl mx-auto px-8 py-12">
          <p className="font-mono text-[10px] tracking-widest uppercase text-[#566F69] mb-2">
            Vega Private Equity LLC
          </p>
          <h1 className="font-mono text-3xl font-bold text-black mb-2">
            Standard Operating Procedures
          </h1>
          <p className="text-sm text-[#566F69] max-w-xl">
            Authoritative procedures for Vega Assisted Living Fund II operations.
            Reviewed quarterly — next review{' '}
            <span className="font-mono">June 30, 2026</span>.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-10">
        {/* Search */}
        <div className="mb-10">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SOPs…"
            className="w-full max-w-md border border-gray-300 px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-black"
          />
        </div>

        {loading && (
          <p className="font-mono text-sm text-[#566F69]">Loading SOP library…</p>
        )}

        {error && (
          <div className="mb-8 bg-[#fffbeb] border-l-4 border-[#f5c542] px-4 py-3 text-sm text-[#92400e]">
            {error}
          </div>
        )}

        {/* Category sections */}
        {Object.entries(grouped).map(([catKey, sops]) => {
          const cat = CATEGORIES[catKey] || { label: catKey, color: '#999' }
          return (
            <section key={catKey} className="mb-12">
              {/* Category heading */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <h2 className="font-mono text-[11px] font-bold tracking-widest uppercase text-black">
                  {cat.label}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="font-mono text-[10px] text-[#797469]">
                  {sops.length} {sops.length === 1 ? 'SOP' : 'SOPs'}
                </span>
              </div>

              {/* SOP cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sops.map(sop => (
                  <SopCard key={sop.id} sop={sop} />
                ))}
              </div>
            </section>
          )
        })}

        {Object.keys(grouped).length === 0 && !loading && (
          <p className="font-mono text-sm text-[#566F69]">
            No SOPs match "{search}".
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-6 text-center">
        <p className="font-mono text-[10px] text-[#797469] tracking-wider uppercase">
          Vega Private Equity LLC · procedures.vegarei.com · Confidential
        </p>
      </footer>
    </div>
  )
}
