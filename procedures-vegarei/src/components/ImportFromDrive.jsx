import { useState, useMemo } from 'react'
import { CATEGORIES, COMPANIES, REVIEW_CADENCES, generateSopId, exportGoogleDocAsHtml, fetchDriveFile, createDriveFile, addSopToIndex, getCompanyFolder, cacheFolderIds } from '../lib/drive'
import { useAuth } from '../lib/auth'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function ImportFromDrive({ company, files, existingSops, index, onImported, onClose }) {
  const { token, user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState('pick') // 'pick' | 'meta'

  // Metadata fields
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [owner, setOwner] = useState('')
  const [reviewCadence, setReviewCadence] = useState('quarterly')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const companyConfig = COMPANIES[company]
  const categoryOptions = useMemo(() => {
    if (!companyConfig) return []
    const builtIn = companyConfig.categories.map(key => ({
      value: key,
      ...CATEGORIES[key],
    }))
    const extraKeys = [...new Set((existingSops || []).map(s => s.category))]
      .filter(k => !companyConfig.categories.includes(k) && CATEGORIES[k])
    const extras = extraKeys.map(key => ({ value: key, ...CATEGORIES[key] }))
    return [...builtIn, ...extras]
  }, [company, existingSops])

  const sopId = useMemo(() => {
    if (!category) return ''
    return generateSopId(company, category, existingSops || [])
  }, [company, category, existingSops])

  const handleSelectFile = (file) => {
    setSelected(file)
    // Auto-fill title from filename
    const name = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
    setTitle(name.charAt(0).toUpperCase() + name.slice(1))
    setStep('meta')
  }

  const handleImport = async () => {
    if (!token || !selected || !category || !title.trim()) return
    setImporting(true)
    setError('')

    try {
      // 1. Fetch the file content
      let htmlContent
      if (selected.mimeType === 'application/vnd.google-apps.document') {
        // Google Doc — export as HTML
        htmlContent = await exportGoogleDocAsHtml(selected.id, token)
      } else if (selected.mimeType === 'text/html' || selected.name.endsWith('.html')) {
        htmlContent = await fetchDriveFile(selected.id, token)
      } else {
        // Plain text / markdown / docx — wrap in basic HTML
        const text = await fetchDriveFile(selected.id, token)
        htmlContent = text
          .split('\n\n')
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('\n')
      }

      // 2. Get or create company folder
      const folderId = await getCompanyFolder(company, index, token)

      // 3. Create the SOP HTML file in Drive
      const htmlFile = await createDriveFile(
        `${sopId}.html`,
        htmlContent,
        'text/html',
        token,
        folderId
      )

      // 4. Create the meta file
      const now = new Date().toISOString().split('T')[0]
      const initialMeta = {
        id: sopId,
        currentVersion: '1.0',
        revisions: [{
          version: '1.0',
          date: now,
          author: user?.name || user?.email || 'Unknown User',
          summary: `Imported from "${selected.name}"`,
          htmlSnapshot: htmlContent,
        }],
        auditLog: [{
          action: 'imported',
          date: new Date().toISOString(),
          user: user?.name || user?.email || 'Unknown User',
          email: user?.email || '',
          source: selected.name,
          sourceFileId: selected.id,
        }],
      }
      const metaFile = await createDriveFile(
        `${sopId}.meta.json`,
        JSON.stringify(initialMeta, null, 2),
        'application/json',
        token,
        folderId
      )

      // 5. Cache folder ID if needed
      let currentIndex = index
      if (folderId && !index?.folderIds?.[company]) {
        currentIndex = await cacheFolderIds(index, company, folderId, index?.folderIds?.root, token)
      }

      // 6. Add to index
      const newSop = {
        id: sopId,
        title: title.trim(),
        category,
        version: '1.0',
        lastReviewed: now,
        status: 'draft',
        owner: owner.trim() || user?.name || user?.email || '',
        company,
        reviewCadence,
        creatorEmail: user?.email || '',
        htmlFileId: htmlFile.id,
        metaFileId: metaFile.id,
      }
      const updatedIndex = await addSopToIndex(currentIndex, newSop, token)

      onImported(updatedIndex, sopId)
    } catch (err) {
      console.error('Import failed:', err)
      setError(`Import failed: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const canImport = title.trim() && category && selected

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[560px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D]">
            Import from Drive
          </span>
          <span style={mono} className="text-[10px] text-[#797469] tracking-wider">
            {files.length} file{files.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Step: Pick a file */}
        {step === 'pick' && (
          <div className="px-6 py-5 overflow-y-auto flex-1">
            <p style={mono} className="text-[10px] uppercase tracking-widest text-[#566F69] mb-3">
              Select a document to import
            </p>
            <div className="space-y-1.5">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 hover:border-black transition-colors text-left group"
                >
                  <FileIcon mimeType={file.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black truncate group-hover:text-[#27474D]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[#797469] font-mono">
                      {formatMimeType(file.mimeType)}
                      {file.modifiedTime && ` · ${new Date(file.modifiedTime).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span style={mono} className="text-[10px] text-[#797469] group-hover:text-black transition-colors">
                    Import &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Fill in metadata */}
        {step === 'meta' && (
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Selected file info */}
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-3">
              <FileIcon mimeType={selected.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-black truncate">{selected.name}</p>
                <p className="text-[10px] text-[#797469] font-mono">{formatMimeType(selected.mimeType)}</p>
              </div>
              <button
                onClick={() => { setStep('pick'); setSelected(null) }}
                className="text-[10px] font-mono text-[#797469] hover:text-black transition-colors px-2 py-1 border border-gray-200 hover:border-black"
              >
                Change
              </button>
            </div>

            {/* Category */}
            <Field label="Category">
              <div className="grid grid-cols-2 gap-1.5">
                {categoryOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCategory(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border transition-colors text-left ${
                      category === opt.value
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 text-gray-600 hover:border-black'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: category === opt.value ? '#fff' : opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Title */}
            <Field label="Title">
              <input
                autoFocus
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lease Renewal Process"
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </Field>

            {/* Owner */}
            <Field label="Owner">
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="e.g. Dan Smith"
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </Field>

            {/* Review Cadence */}
            <Field label="Review Cadence">
              <div className="flex gap-1.5">
                {Object.entries(REVIEW_CADENCES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setReviewCadence(key)}
                    className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                      reviewCadence === key
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 text-[#797469] hover:border-black'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* SOP ID preview */}
            {sopId && (
              <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p style={mono} className="text-[9px] uppercase tracking-widest text-[#566F69] mb-1">
                    SOP ID (auto-generated)
                  </p>
                  <p style={mono} className="text-sm font-bold text-black tracking-wider">
                    {sopId}
                  </p>
                </div>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIES[category]?.color }}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 items-center">
          {step === 'meta' && (
            <button
              onClick={() => { setStep('pick'); setSelected(null) }}
              disabled={importing}
              style={mono}
              className="text-[10px] uppercase tracking-wider text-[#797469] hover:text-black transition-colors"
            >
              &larr; Back
            </button>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
            >
              Cancel
            </button>

            {step === 'meta' && (
              <button
                onClick={handleImport}
                disabled={importing || !canImport}
                className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing…
                  </>
                ) : (
                  'Import as SOP'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function FileIcon({ mimeType }) {
  const isGoogleDoc = mimeType === 'application/vnd.google-apps.document'
  return (
    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isGoogleDoc ? 'bg-blue-50' : 'bg-gray-100'}`}>
      {isGoogleDoc ? (
        <svg viewBox="0 0 16 16" className="w-4 h-4 text-blue-500" fill="currentColor">
          <path d="M14 4.5V14a2 2 0 01-2 2H4a2 2 0 01-2-2V2a2 2 0 012-2h5.5L14 4.5zM10 4V1L13 4h-3zM5 7h6v1H5V7zm0 2h6v1H5V9zm0 2h4v1H5v-1z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function formatMimeType(mimeType) {
  const map = {
    'application/vnd.google-apps.document': 'Google Doc',
    'text/html': 'HTML',
    'text/plain': 'Text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
  }
  return map[mimeType] || mimeType
}
