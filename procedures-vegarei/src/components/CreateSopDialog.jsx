import { useState, useMemo, useRef } from 'react'
import { CATEGORIES, COMPANIES, REVIEW_CADENCES, generateSopId } from '../lib/drive'
import { parseUploadedFile } from '../lib/fileParser'

const mono = { fontFamily: "'Space Mono', monospace" }

const CUSTOM_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#78716c', '#6366f1']

export default function CreateSopDialog({ company, existingSops, onSave, onCancel, loading }) {
  // Metadata
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [owner, setOwner] = useState('')
  const [reviewCadence, setReviewCadence] = useState('quarterly')

  // Custom category
  const [showCustom, setShowCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customCode, setCustomCode] = useState('')

  // Upload
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef(null)

  const companyConfig = COMPANIES[company]
  const categoryOptions = useMemo(() => {
    if (!companyConfig) return []
    const builtIn = companyConfig.categories.map(key => ({
      value: key,
      ...CATEGORIES[key],
    }))
    const extraKeys = [...new Set((existingSops || []).map(s => s.category))]
      .filter(k => !companyConfig.categories.includes(k) && CATEGORIES[k])
    const extras = extraKeys.map(key => ({
      value: key,
      ...CATEGORIES[key],
    }))
    return [...builtIn, ...extras]
  }, [company, existingSops])

  const existingSubcategories = useMemo(() => {
    if (!category) return []
    const subs = (existingSops || [])
      .filter(s => s.category === category && s.subcategory)
      .map(s => s.subcategory)
    return [...new Set(subs)].sort()
  }, [category, existingSops])

  const subcategoryExists = useMemo(() => {
    return existingSubcategories.some(s => s.toLowerCase() === subcategory.trim().toLowerCase())
  }, [subcategory, existingSubcategories])

  const sopId = useMemo(() => {
    if (!category) return ''
    return generateSopId(company, category, existingSops || [])
  }, [company, category, existingSops])

  const canSubmit = title.trim() && category

  const handleAddCustom = () => {
    if (!customLabel.trim() || !customCode.trim()) return
    const key = customLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const usedColors = categoryOptions.map(o => o.color)
    const color = CUSTOM_COLORS.find(c => !usedColors.includes(c)) || '#797469'
    CATEGORIES[key] = { label: customLabel.trim(), color, code: customCode.trim().toUpperCase() }
    setCategory(key)
    setSubcategory('')
    setShowCustom(false)
    setCustomLabel('')
    setCustomCode('')
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadedFile(file)
    setParsing(true)
    try {
      const text = await parseUploadedFile(file)
      setUploadedText(text)
      if (!title) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(name.charAt(0).toUpperCase() + name.slice(1))
      }
    } catch (err) {
      setUploadError(err.message)
      setUploadedText('')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = () => {
    const isHtml = uploadedFile?.name?.match(/\.html?$/i)
    onSave({
      sopId,
      title: title.trim(),
      category,
      subcategory: subcategory.trim(),
      owner: owner.trim(),
      company,
      reviewCadence,
      description: !isHtml && uploadedText ? uploadedText.trim() : '',
      useAi: false,
      uploadedHtml: isHtml ? uploadedText.trim() : '',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[560px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D]">
            New Procedure
          </span>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Upload area — prominent at the top */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.txt,.md,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!uploadedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 hover:border-black transition-colors py-6 flex flex-col items-center gap-2 group"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs font-mono text-[#797469] group-hover:text-black transition-colors">
                  Upload a file
                </p>
                <p className="text-[10px] font-mono text-gray-400">
                  .docx, .html, .txt, .md
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#27474D]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p className="text-xs font-mono text-black">{uploadedFile.name}</p>
                      <p className="text-[10px] text-[#797469]">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setUploadedText('')
                      setUploadError('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-[10px] font-mono text-[#797469] hover:text-black transition-colors px-2 py-1 border border-gray-200 hover:border-black"
                  >
                    Remove
                  </button>
                </div>

                {parsing && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200">
                    <span className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    <span className="text-xs text-[#797469]">Parsing document...</span>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                    {uploadError}
                  </div>
                )}

                {uploadedText && !parsing && (
                  <div className="border border-gray-200 bg-white px-4 py-3 max-h-32 overflow-y-auto">
                    {uploadedFile?.name?.match(/\.html?$/i) ? (
                      <div
                        className="sop-document text-xs"
                        dangerouslySetInnerHTML={{ __html: uploadedText.slice(0, 3000) }}
                      />
                    ) : (
                      <pre className="text-[11px] text-[#566F69] whitespace-pre-wrap font-mono leading-relaxed">
                        {uploadedText.slice(0, 1500)}{uploadedText.length > 1500 ? '\n…' : ''}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span style={mono} className="text-[9px] text-[#797469] uppercase tracking-widest">Details</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Category */}
          <Field label="Category">
            <div className="grid grid-cols-2 gap-1.5">
              {categoryOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setCategory(opt.value); setSubcategory(''); setShowCustom(false) }}
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
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border transition-colors text-left ${
                  showCustom
                    ? 'border-[#27474D] text-[#27474D]'
                    : 'border-dashed border-gray-300 text-[#797469] hover:border-gray-500'
                }`}
              >
                <span className="text-sm leading-none">+</span>
                Custom
              </button>
            </div>

            {showCustom && (
              <div className="mt-2 p-3 border border-gray-200 bg-gray-50 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLabel}
                    onChange={e => {
                      setCustomLabel(e.target.value)
                      const words = e.target.value.trim().split(/\s+/)
                      const suggested = words.map(w => w[0]?.toUpperCase() || '').join('').slice(0, 6)
                      if (!customCode || customCode === customLabel.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 6)) {
                        setCustomCode(suggested)
                      }
                    }}
                    placeholder="e.g. Sales Operations"
                    className="flex-1 border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    placeholder="CODE"
                    maxLength={6}
                    className="w-24 border border-gray-300 px-2 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-[#797469]">
                    Code is used in the SOP ID (e.g. {companyConfig?.prefix || 'XX'}-{customCode || '???'}-001)
                  </p>
                  <button
                    onClick={handleAddCustom}
                    disabled={!customLabel.trim() || !customCode.trim()}
                    className="text-[10px] font-mono px-3 py-1 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </Field>

          {/* SOP ID preview - show right after category selection */}
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

          {/* Title */}
          <Field label="Title">
            <input
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

        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 items-center">
          <div className="ml-auto flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                uploadedFile ? 'Upload & Create SOP' : 'Create SOP'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
