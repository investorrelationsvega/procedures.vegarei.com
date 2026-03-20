import { useState, useMemo, useRef } from 'react'
import { CATEGORIES, COMPANIES, REVIEW_CADENCES, generateSopId } from '../lib/drive'
import { parseUploadedFile } from '../lib/fileParser'

const mono = { fontFamily: "'Space Mono', monospace" }

// Colors for custom categories
const CUSTOM_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#78716c', '#6366f1']

export default function CreateSopDialog({ company, existingSops, onSave, onCancel, loading }) {
  const [step, setStep] = useState(1)

  // Step 1: metadata
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [owner, setOwner] = useState('')
  const [reviewCadence, setReviewCadence] = useState('quarterly')

  // Custom category
  const [showCustom, setShowCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customCode, setCustomCode] = useState('')

  // Step 2: mode — 'ai' | 'blank' | 'upload'
  const [mode, setMode] = useState('ai')
  const [description, setDescription] = useState('')

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [parsing, setParsing] = useState(false)
  const fileInputRef = useRef(null)

  // Get categories for this business unit + any custom ones from existing SOPs
  const companyConfig = COMPANIES[company]
  const categoryOptions = useMemo(() => {
    if (!companyConfig) return []
    const builtIn = companyConfig.categories.map(key => ({
      value: key,
      ...CATEGORIES[key],
    }))
    // Add any categories from existing SOPs that aren't in the built-in list
    const extraKeys = [...new Set((existingSops || []).map(s => s.category))]
      .filter(k => !companyConfig.categories.includes(k) && CATEGORIES[k])
    const extras = extraKeys.map(key => ({
      value: key,
      ...CATEGORIES[key],
    }))
    return [...builtIn, ...extras]
  }, [company, existingSops])

  // Auto-generate SOP ID based on selections
  const sopId = useMemo(() => {
    if (!category) return ''
    return generateSopId(company, category, existingSops || [])
  }, [company, category, existingSops])

  const canProceed = title.trim() && category
  const canGenerate = mode === 'ai'
    ? description.trim().length > 0
    : mode === 'upload'
      ? uploadedText.trim().length > 0
      : true

  const handleAddCustom = () => {
    if (!customLabel.trim() || !customCode.trim()) return
    const key = customLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    // Pick a color that's not already used
    const usedColors = categoryOptions.map(o => o.color)
    const color = CUSTOM_COLORS.find(c => !usedColors.includes(c)) || '#797469'
    // Register in CATEGORIES (runtime only — persists via the SOP's category field)
    CATEGORIES[key] = { label: customLabel.trim(), color, code: customCode.trim().toUpperCase() }
    setCategory(key)
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
      // Auto-fill title from filename if title is empty
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
    onSave({
      sopId,
      title: title.trim(),
      category,
      owner: owner.trim(),
      company,
      reviewCadence,
      description: mode === 'ai' ? description.trim() : mode === 'upload' ? uploadedText.trim() : '',
      useAi: mode !== 'blank',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[560px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D]">
            New Procedure
          </span>
          <div className="flex items-center gap-2">
            <StepDot active={step === 1} done={step > 1} label="1" />
            <div className="w-6 h-px bg-gray-300" />
            <StepDot active={step === 2} done={false} label="2" />
          </div>
        </div>

        {/* Step 1: Metadata */}
        {step === 1 && (
          <div className="px-6 py-5 space-y-4 overflow-y-auto">
            {/* Category */}
            <Field label="Category">
              <div className="grid grid-cols-2 gap-1.5">
                {categoryOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setCategory(opt.value); setShowCustom(false) }}
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
                {/* Add custom */}
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

              {/* Custom category form */}
              {showCustom && (
                <div className="mt-2 p-3 border border-gray-200 bg-gray-50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customLabel}
                      onChange={e => {
                        setCustomLabel(e.target.value)
                        // Auto-suggest code from initials if user hasn't manually edited
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

            {/* Auto-generated ID preview */}
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
          </div>
        )}

        {/* Step 2: Process Description */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Summary of what we're creating */}
            <div className="bg-gray-50 border border-gray-200 px-4 py-2.5 flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: CATEGORIES[category]?.color }}
              />
              <span style={mono} className="text-[10px] font-bold text-black tracking-wider">{sopId}</span>
              <span className="text-xs text-[#566F69] truncate">{title}</span>
            </div>

            {/* Mode toggle — 3 options */}
            <div className="flex gap-1.5">
              <ModeButton active={mode === 'ai'} onClick={() => setMode('ai')}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: mode === 'ai' ? '#22c55e' : '#797469' }} />
                Generate with AI
              </ModeButton>
              <ModeButton active={mode === 'upload'} onClick={() => setMode('upload')}>
                <UploadIcon active={mode === 'upload'} />
                Upload Document
              </ModeButton>
              <ModeButton active={mode === 'blank'} onClick={() => setMode('blank')}>
                Blank Template
              </ModeButton>
            </div>

            {/* AI mode */}
            {mode === 'ai' && (
              <>
                <Field label="Describe the Process">
                  <textarea
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={"Describe how this process works in plain English. Be as detailed as you want — the AI will format it into a proper SOP.\n\nExample: \"When a new investor wants to subscribe to a fund, we first collect their personal info and accreditation documents. The compliance team reviews everything within 48 hours. If approved, we send the subscription agreement via DocuSign. Once signed and funds are wired, we confirm the allocation and update the cap table.\""}
                    rows={8}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-y"
                  />
                </Field>

                <SectionPreview />
              </>
            )}

            {/* Upload mode */}
            {mode === 'upload' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!uploadedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-black transition-colors py-10 flex flex-col items-center gap-3 group"
                  >
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-center">
                      <p className="text-xs font-mono text-[#797469] group-hover:text-black transition-colors">
                        Click to upload a document
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 mt-1">
                        .docx, .doc, .txt, .md
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* File info */}
                    <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#27474D]" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                          <p className="text-xs font-mono text-black">{uploadedFile.name}</p>
                          <p className="text-[10px] text-[#797469]">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
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
                      <>
                        {/* Preview of extracted text */}
                        <Field label={`Extracted Content (${uploadedText.split(/\n/).length} lines)`}>
                          <div className="border border-gray-200 bg-gray-50 px-3 py-2 max-h-40 overflow-y-auto">
                            <pre className="text-[11px] text-[#566F69] whitespace-pre-wrap font-mono leading-relaxed">
                              {uploadedText.slice(0, 2000)}{uploadedText.length > 2000 ? '\n…' : ''}
                            </pre>
                          </div>
                        </Field>

                        <SectionPreview label="The uploaded content will be reformatted into" />
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Blank mode */}
            {mode === 'blank' && (
              <div className="bg-gray-50 border border-gray-200 px-4 py-4">
                <p className="text-xs text-[#566F69] mb-1">
                  A blank SOP will be created with the standard Vega template sections.
                </p>
                <p className="text-xs text-[#797469]">
                  You can fill in each section manually in the editor.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 items-center">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              style={mono}
              className="text-[10px] uppercase tracking-wider text-[#797469] hover:text-black transition-colors"
            >
              &larr; Back
            </button>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
              >
                Next
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={loading || !canGenerate}
                className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'blank' ? 'Creating…' : 'Formatting…'}
                  </>
                ) : (
                  mode === 'ai' ? 'Generate SOP'
                    : mode === 'upload' ? 'Format & Create SOP'
                    : 'Create SOP'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────

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

function StepDot({ active, done, label }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
        active
          ? 'bg-black text-white'
          : done
            ? 'bg-[#27474D] text-white'
            : 'bg-gray-200 text-[#797469]'
      }`}
    >
      {done ? '✓' : label}
    </span>
  )
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 text-[10px] font-mono border transition-colors ${
        active
          ? 'bg-black text-white border-black'
          : 'border-gray-200 text-[#797469] hover:border-black'
      }`}
    >
      {children}
    </button>
  )
}

function UploadIcon({ active }) {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 10V3m0 0L5.5 5.5M8 3l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11v2h10v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionPreview({ label = 'The generated SOP will include' }) {
  const mono = { fontFamily: "'Space Mono', monospace" }
  return (
    <div className="bg-gray-50 border border-gray-200 px-4 py-3">
      <p style={mono} className="text-[9px] uppercase tracking-widest text-[#566F69] mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {['Purpose', 'Scope', 'Definitions', 'Responsibilities', 'Procedure', 'Related Documents', 'Revision History'].map(s => (
          <span key={s} className="text-[11px] text-[#566F69] flex items-center gap-1.5">
            <span className="text-[#22c55e]">&#10003;</span> {s}
          </span>
        ))}
      </div>
    </div>
  )
}
