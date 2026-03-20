import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadIndex, CATEGORIES, createDriveFile, addSopToIndex } from '../lib/drive'
import { MOCK_INDEX } from '../lib/mockData'
import SopCard from '../components/SopCard'
import CreateSopDialog from '../components/CreateSopDialog'

const COMPANY_LABELS = {
  'assisted-living': 'Assisted Living',
  'builders': 'Builders',
  'capital-markets': 'Capital Markets',
  'development': 'Development',
  'hospice': 'Hospice',
  'private-equity': 'Private Equity',
  'property-management': 'Property Management',
  'valuations': 'Valuations',
  'employee-handbook': 'Employee Handbook',
}

const DEFAULT_SOP_HTML = `<h2>1. Purpose</h2>
<p>Describe the purpose of this procedure.</p>
<h2>2. Scope</h2>
<p>Define who and what this procedure applies to.</p>
<h2>3. Responsibilities</h2>
<p>List the roles responsible for each step.</p>
<h2>4. Procedure</h2>
<ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>
<h2>5. References</h2>
<p>List any related documents, policies, or contacts.</p>`

export default function CompanySops() {
  const { company } = useParams()
  const { token, user, isAuthed } = useAuth()
  const navigate = useNavigate()
  const [index, setIndex] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const companyName = COMPANY_LABELS[company] || company

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (import.meta.env.VITE_DRIVE_INDEX_FILE_ID && token) {
          const data = await loadIndex(token)
          setIndex(data)
        } else {
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

  const handleCreate = useCallback(async ({ sopId, title, category, owner, company: comp }) => {
    if (!token) return
    setCreating(true)
    try {
      // Create HTML file in Drive
      const htmlFile = await createDriveFile(
        `${sopId}.html`,
        DEFAULT_SOP_HTML,
        'text/html',
        token
      )

      // Create meta file in Drive
      const now = new Date().toISOString().split('T')[0]
      const initialMeta = {
        id: sopId,
        currentVersion: '1.0',
        revisions: [{
          version: '1.0',
          date: now,
          author: user?.name || user?.email || 'Unknown User',
          summary: 'Initial creation',
          htmlSnapshot: DEFAULT_SOP_HTML,
        }],
        auditLog: [{
          action: 'created',
          date: new Date().toISOString(),
          user: user?.name || user?.email || 'Unknown User',
          email: user?.email || '',
        }],
      }
      const metaFile = await createDriveFile(
        `${sopId}.meta.json`,
        JSON.stringify(initialMeta, null, 2),
        'application/json',
        token
      )

      // Add to index
      const newSop = {
        id: sopId,
        title,
        category,
        version: '1.0',
        lastReviewed: now,
        status: 'draft',
        owner: owner || user?.name || user?.email || '',
        company: comp,
        htmlFileId: htmlFile.id,
        metaFileId: metaFile.id,
      }
      const updatedIndex = await addSopToIndex(index, newSop, token)
      setIndex(updatedIndex)
      setShowCreate(false)
      navigate(`/sop/${sopId}`)
    } catch (err) {
      console.error(err)
      alert('Failed to create SOP. Check Drive permissions and try again.')
    } finally {
      setCreating(false)
    }
  }, [token, user, index, navigate])

  // Filter SOPs for this company
  const companySops = index?.sops?.filter(s => s.company === company) || []

  const grouped = {}
  const filtered = companySops.filter(s =>
    search === '' ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  )
  filtered.forEach(sop => {
    const key = sop.category || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(sop)
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200" style={{ background: '#FDF6E5' }}>
        <div className="max-w-screen-xl mx-auto px-8 py-12">
          <Link
            to="/"
            className="inline-block text-[10px] tracking-widest uppercase text-[#A8A295] mb-3 no-underline hover:text-black transition-colors"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            &larr; All Companies
          </Link>
          <p className="text-[10px] tracking-widest uppercase text-[#566F69] mb-2"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Vega {companyName}
          </p>
          <h1 className="text-3xl font-bold text-black mb-2">
            Standard Operating Procedures
          </h1>
          <p className="text-sm text-[#566F69] max-w-xl">
            Authoritative procedures for Vega {companyName} operations.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-10">
        <div className="mb-10 flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SOPs…"
            className="w-full max-w-md border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          {isAuthed && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs font-mono bg-black text-white px-4 py-2.5 hover:bg-[#27474D] transition-colors whitespace-nowrap"
            >
              + New SOP
            </button>
          )}
        </div>

        {loading && (
          <p className="text-sm text-[#566F69]"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Loading SOP library…
          </p>
        )}

        {error && (
          <div className="mb-8 bg-[#fffbeb] border-l-4 border-[#f5c542] px-4 py-3 text-sm text-[#92400e]">
            {error}
          </div>
        )}

        {Object.entries(grouped).map(([catKey, sops]) => {
          const cat = CATEGORIES[catKey] || { label: catKey, color: '#999' }
          return (
            <section key={catKey} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-black"
                    style={{ fontFamily: "'Space Mono', monospace" }}>
                  {cat.label}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-[#797469]"
                      style={{ fontFamily: "'Space Mono', monospace" }}>
                  {sops.length} {sops.length === 1 ? 'SOP' : 'SOPs'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sops.map(sop => (
                  <SopCard key={sop.id} sop={sop} />
                ))}
              </div>
            </section>
          )
        })}

        {Object.keys(grouped).length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-sm text-[#566F69] mb-4"
               style={{ fontFamily: "'Space Mono', monospace" }}>
              {search ? `No SOPs match "${search}".` : 'No SOPs created yet for this business unit.'}
            </p>
            {isAuthed && !search && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs font-mono bg-black text-white px-4 py-2.5 hover:bg-[#27474D] transition-colors"
              >
                + Create First SOP
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 mt-16 py-6 text-center">
        <p className="text-[10px] text-[#797469] tracking-wider uppercase"
           style={{ fontFamily: "'Space Mono', monospace" }}>
          Vega {companyName} · procedures.vegarei.com · Confidential
        </p>
      </footer>

      {showCreate && (
        <CreateSopDialog
          company={company}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={creating}
        />
      )}
    </div>
  )
}
