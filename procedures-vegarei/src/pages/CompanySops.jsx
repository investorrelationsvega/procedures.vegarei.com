import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadIndex, CATEGORIES, COMPANIES, createDriveFile, createGoogleDoc, addSopToIndex, getReviewStatus, getCompanyFolder, getCategoryFolder, cacheFolderIds, findUnindexedFiles } from '../lib/drive'
import { MOCK_INDEX } from '../lib/mockData'
import { DEFAULT_SOP_HTML, generateSopHtml, wrapContentInTemplate } from '../lib/sopTemplate'
import SopCard from '../components/SopCard'
import CreateSopDialog from '../components/CreateSopDialog'
import ImportFromDrive from '../components/ImportFromDrive'

const mono = { fontFamily: "'Space Mono', monospace" }

const SORT_OPTIONS = [
  { value: 'reviewed-desc', label: 'Last Reviewed (newest)' },
  { value: 'reviewed-asc',  label: 'Last Reviewed (oldest)' },
  { value: 'title-asc',     label: 'Title (A–Z)' },
  { value: 'title-desc',    label: 'Title (Z–A)' },
  { value: 'status',        label: 'Status' },
  { value: 'id',            label: 'SOP ID' },
]

const STATUS_ORDER = { review: 0, draft: 1, active: 2 }

function isOverdue(sop) {
  return getReviewStatus(sop.lastReviewed, sop.reviewCadence) === 'overdue'
}

function sortSops(sops, sortBy) {
  const sorted = [...sops]
  switch (sortBy) {
    case 'reviewed-desc':
      return sorted.sort((a, b) => new Date(b.lastReviewed) - new Date(a.lastReviewed))
    case 'reviewed-asc':
      return sorted.sort((a, b) => new Date(a.lastReviewed) - new Date(b.lastReviewed))
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case 'status':
      return sorted.sort((a, b) => {
        const sa = isOverdue(a) ? 'review' : (a.status || 'active')
        const sb = isOverdue(b) ? 'review' : (b.status || 'active')
        return (STATUS_ORDER[sa] ?? 3) - (STATUS_ORDER[sb] ?? 3)
      })
    case 'id':
      return sorted.sort((a, b) => a.id.localeCompare(b.id))
    default:
      return sorted
  }
}

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
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('reviewed-desc')
  const [unindexedFiles, setUnindexedFiles] = useState([])
  const [showImport, setShowImport] = useState(false)
  const [scanningDrive, setScanningDrive] = useState(false)

  const companyConfig = COMPANIES[company]
  const companyName = companyConfig?.label || company

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

  // Scan Drive folder for unindexed files when index loads
  useEffect(() => {
    if (!index || !token || !index.folderIds?.[company]) return
    let cancelled = false
    async function scan() {
      setScanningDrive(true)
      try {
        const files = await findUnindexedFiles(company, index, token)
        if (!cancelled) setUnindexedFiles(files)
      } catch (err) {
        console.error('Drive scan failed:', err)
      } finally {
        if (!cancelled) setScanningDrive(false)
      }
    }
    scan()
    return () => { cancelled = true }
  }, [index, token, company])

  const handleImported = useCallback((updatedIndex, sopId) => {
    setIndex(updatedIndex)
    setShowImport(false)
    setUnindexedFiles(prev => prev.filter(f => f.id !== sopId))
    navigate(`/sop/${sopId}`)
  }, [navigate])

  const handleCreate = useCallback(async ({ sopId, title, category, subcategory, owner, company: comp, reviewCadence, description, useAi, uploadedHtml }) => {
    if (!token) return
    setCreating(true)
    try {
      // Use uploaded HTML directly, wrap text uploads in template, or generate blank template
      let sopHtml
      if (uploadedHtml) {
        sopHtml = uploadedHtml
      } else if (description) {
        // Plain text content from AI or text upload — wrap in Vega template
        sopHtml = wrapContentInTemplate({
          sopId, title, category: CATEGORIES[category]?.label || category,
          owner: owner || user?.name || '', author: user?.name || '',
          reviewCadence: reviewCadence || 'Quarterly', content: description,
        })
      } else {
        sopHtml = generateSopHtml({
          sopId, title, category: CATEGORIES[category]?.label || category,
          owner: owner || user?.name || '', author: user?.name || '',
          reviewCadence: reviewCadence || 'Quarterly',
        })
      }

      // Get (or create) the category folder in Drive
      // Standard Operating Procedures / {Business Unit} / {Category}
      const folderId = await getCategoryFolder(comp, category, index, token)

      const htmlFile = await createGoogleDoc(
        sopId,
        sopHtml,
        token,
        folderId
      )
      const now = new Date().toISOString().split('T')[0]
      const initialMeta = {
        id: sopId,
        currentVersion: '1.0',
        revisions: [{
          version: '1.0',
          date: now,
          author: user?.name || user?.email || 'Unknown User',
          summary: 'Initial creation',
          htmlSnapshot: sopHtml,
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
        token,
        folderId
      )

      // Cache the folder ID in the index so we don't look it up every time
      let currentIndex = index
      if (folderId && !index?.folderIds?.[comp]) {
        currentIndex = await cacheFolderIds(index, comp, folderId, index?.folderIds?.root, token)
      }

      const newSop = {
        id: sopId,
        title,
        category,
        subcategory: subcategory || '',
        version: '1.0',
        lastReviewed: now,
        status: 'draft',
        owner: owner || user?.name || user?.email || '',
        company: comp,
        reviewCadence: reviewCadence || 'quarterly',
        creatorEmail: user?.email || '',
        htmlFileId: htmlFile.id,
        metaFileId: metaFile.id,
      }
      const updatedIndex = await addSopToIndex(currentIndex, newSop, token)
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

  // Filter SOPs for this company — separate active from archived
  const allCompanySops = index?.sops?.filter(s => s.company === company) || []
  const companySops = allCompanySops.filter(s => s.status !== 'archived')
  const archivedSops = allCompanySops.filter(s => s.status === 'archived')

  const filtered = useMemo(() => {
    const source = activeFilter === 'archived' ? archivedSops : companySops
    let result = source.filter(s => {
      const matchesSearch = search === '' ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = activeFilter === 'all' || activeFilter === 'archived' || s.category === activeFilter
      return matchesSearch && matchesFilter
    })
    return sortSops(result, sortBy)
  }, [companySops, archivedSops, search, activeFilter, sortBy])

  // Get unique categories that exist in this company's active SOPs
  const activeCategories = [...new Set(companySops.map(s => s.category))]

  // Group filtered SOPs by category
  const grouped = {}
  filtered.forEach(sop => {
    const key = sop.category || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(sop)
  })

  const totalSops = companySops.length
  const activeSops = companySops.filter(s => s.status === 'active').length
  const overdueSops = companySops.filter(s => isOverdue(s)).length

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Compact header bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-8">
          {/* Back link */}
          <div className="pt-5 pb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase no-underline transition-colors"
              style={{ ...mono, color: '#797469' }}
              onMouseEnter={e => e.currentTarget.style.color = '#000'}
              onMouseLeave={e => e.currentTarget.style.color = '#797469'}
            >
              <span style={{ fontSize: 14 }}>&larr;</span> All Companies
            </Link>
          </div>

          {/* Title row */}
          <div className="flex items-end justify-between pb-5">
            <div>
              <p style={mono} className="text-[10px] tracking-widest uppercase text-[#27474D] mb-1.5">
                Vega {companyName}
              </p>
              <h1 className="text-2xl font-bold text-black leading-tight">
                Procedures
              </h1>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 pb-1">
              <div className="text-right">
                <span style={mono} className="text-[18px] font-bold text-black">{totalSops}</span>
                <span style={mono} className="text-[10px] text-[#797469] ml-1.5 uppercase tracking-wider">Total</span>
              </div>
              <div className="w-px h-5 bg-gray-200" />
              <div className="text-right">
                <span style={mono} className="text-[18px] font-bold text-[#22c55e]">{activeSops}</span>
                <span style={mono} className="text-[10px] text-[#797469] ml-1.5 uppercase tracking-wider">Active</span>
              </div>
              {overdueSops > 0 && (
                <>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="text-right">
                    <span style={mono} className="text-[18px] font-bold text-[#f5c542]">{overdueSops}</span>
                    <span style={mono} className="text-[10px] text-[#797469] ml-1.5 uppercase tracking-wider">Due</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search + filters + sort bar */}
      <div className="border-b border-gray-100 bg-[#fafafa]">
        <div className="max-w-screen-xl mx-auto px-8 py-3 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or ID…"
              className="w-full border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                activeFilter === 'all'
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-[#797469] hover:border-gray-400'
              }`}
            >
              All
            </button>
            {activeCategories.map(catKey => {
              const cat = CATEGORIES[catKey] || { label: catKey, color: '#999' }
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveFilter(activeFilter === catKey ? 'all' : catKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                    activeFilter === catKey
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-[#797469] hover:border-gray-400'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: activeFilter === catKey ? '#fff' : cat.color }}
                  />
                  {cat.label}
                </button>
              )
            })}
            {archivedSops.length > 0 && (
              <button
                onClick={() => setActiveFilter(activeFilter === 'archived' ? 'all' : 'archived')}
                className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  activeFilter === 'archived'
                    ? 'bg-black text-white border-black'
                    : 'border-dashed border-gray-300 text-[#797469] hover:border-gray-400'
                }`}
              >
                Archived ({archivedSops.length})
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-mono text-[#797469] focus:outline-none focus:border-black cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {isAuthed && unindexedFiles.length > 0 && (
              <button
                onClick={() => setShowImport(true)}
                className="text-[10px] font-mono uppercase tracking-wider border border-gray-200 text-[#797469] px-3 py-2 hover:border-black hover:text-black transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3v7m0 0L5.5 7.5M8 10l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 11v2h10v-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Import ({unindexedFiles.length})
              </button>
            )}
            {isAuthed && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-[10px] font-mono uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-[#27474D] transition-colors flex items-center gap-1.5"
              >
                <span className="text-sm leading-none">+</span> New SOP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-screen-xl mx-auto px-8 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 border border-[#f5c542]/40 bg-[#fffbeb]">
              <span className="text-[#f5c542] mt-0.5">&#9888;</span>
              <span className="text-xs text-[#92400e]">{error}</span>
            </div>
          )}

          {/* Unindexed files banner */}
          {unindexedFiles.length > 0 && isAuthed && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 border border-[#00d4ff]/30 bg-[#f0fbff]">
              <span className="text-[#00d4ff] text-sm">&#9660;</span>
              <div className="flex-1">
                <span className="text-xs text-[#0c4a6e] font-medium">
                  {unindexedFiles.length} new document{unindexedFiles.length !== 1 ? 's' : ''} found in Drive
                </span>
                <span className="text-[10px] text-[#0c4a6e]/60 ml-2">
                  Not yet linked as procedures
                </span>
              </div>
              <button
                onClick={() => setShowImport(true)}
                style={mono}
                className="text-[10px] uppercase tracking-wider bg-black text-white px-4 py-1.5 hover:bg-[#27474D] transition-colors"
              >
                Review &amp; Import
              </button>
              <button
                onClick={() => setUnindexedFiles([])}
                className="text-[10px] font-mono text-[#797469] hover:text-black transition-colors px-2 py-1"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          )}

          {Object.entries(grouped).map(([catKey, sops]) => {
            const cat = CATEGORIES[catKey] || { label: catKey, color: '#999' }
            return (
              <section key={catKey} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span style={mono} className="text-[10px] font-bold tracking-widest uppercase text-black">
                    {cat.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span style={mono} className="text-[10px] text-[#797469] tracking-wider">
                    {sops.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {sops.map(sop => (
                    <SopCard key={sop.id} sop={sop} />
                  ))}
                </div>
              </section>
            )
          })}

          {Object.keys(grouped).length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <p style={mono} className="text-sm text-[#797469] uppercase tracking-wider mb-6">
                {search ? `No results for "${search}"` : 'None here yet'}
              </p>
              {search ? (
                <p className="text-xs text-[#797469]">Try a different search term.</p>
              ) : isAuthed ? (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-[10px] font-mono uppercase tracking-wider bg-black text-white px-5 py-2.5 hover:bg-[#27474D] transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sm leading-none">+</span> Create SOP
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-5">
        <div className="max-w-screen-xl mx-auto px-8 flex items-center justify-between">
          <span style={mono} className="text-[10px] text-[#797469]">
            Vega {companyName}
          </span>
          <span style={mono} className="text-[10px] text-[#797469]">
            procedures.vegarei.com
          </span>
        </div>
      </footer>

      {showCreate && (
        <CreateSopDialog
          company={company}
          existingSops={companySops}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={creating}
        />
      )}

      {showImport && (
        <ImportFromDrive
          company={company}
          files={unindexedFiles}
          existingSops={companySops}
          index={index}
          onImported={handleImported}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
