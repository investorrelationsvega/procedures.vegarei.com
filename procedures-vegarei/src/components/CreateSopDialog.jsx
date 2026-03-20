import { useState } from 'react'
import { CATEGORIES } from '../lib/drive'

const mono = { fontFamily: "'Space Mono', monospace" }

const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([key, val]) => ({
  value: key,
  label: val.label,
  color: val.color,
}))

export default function CreateSopDialog({ company, onSave, onCancel, loading }) {
  const [step, setStep] = useState(1)

  // Step 1: metadata
  const [title, setTitle] = useState('')
  const [sopId, setSopId] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value)
  const [owner, setOwner] = useState('')

  // Step 2: process description
  const [description, setDescription] = useState('')
  const [useAi, setUseAi] = useState(true)

  const canProceed = sopId.trim() && title.trim()
  const canGenerate = useAi ? description.trim().length > 0 : true

  const handleSubmit = () => {
    onSave({
      sopId: sopId.trim(),
      title: title.trim(),
      category,
      owner: owner.trim(),
      company,
      description: useAi ? description.trim() : '',
      useAi,
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
            {/* SOP ID */}
            <Field label="SOP ID">
              <input
                autoFocus
                type="text"
                value={sopId}
                onChange={e => setSopId(e.target.value.toUpperCase())}
                placeholder="e.g. OPS-SOP-001"
                className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-black"
              />
            </Field>

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

            {/* Category */}
            <Field label="Category">
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORY_OPTIONS.map(opt => (
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
          </div>
        )}

        {/* Step 2: Process Description */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setUseAi(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-mono border transition-colors ${
                  useAi
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-[#797469] hover:border-black'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: useAi ? '#22c55e' : '#797469' }} />
                Generate with AI
              </button>
              <button
                onClick={() => setUseAi(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-mono border transition-colors ${
                  !useAi
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-[#797469] hover:border-black'
                }`}
              >
                Blank Template
              </button>
            </div>

            {useAi ? (
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

                {/* What you get */}
                <div className="bg-gray-50 border border-gray-200 px-4 py-3">
                  <p style={mono} className="text-[9px] uppercase tracking-widest text-[#566F69] mb-2">
                    The generated SOP will include
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {['Purpose', 'Scope', 'Definitions', 'Responsibilities', 'Procedure', 'Related Documents', 'Revision History'].map(s => (
                      <span key={s} className="text-[11px] text-[#566F69] flex items-center gap-1.5">
                        <span className="text-[#22c55e]">&#10003;</span> {s}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
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
                    {useAi ? 'Generating…' : 'Creating…'}
                  </>
                ) : (
                  useAi ? 'Generate SOP' : 'Create SOP'
                )}
              </button>
            )}
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
