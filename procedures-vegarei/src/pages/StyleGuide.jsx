import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  loadStyleGuide, saveStyleGuide,
  FORMALITY_OPTIONS, VOICE_OPTIONS, DETAIL_OPTIONS,
  DEFAULT_STYLE_GUIDE, buildStylePrompt,
} from '../lib/styleGuide'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function StyleGuide() {
  const [guide, setGuide] = useState(DEFAULT_STYLE_GUIDE)
  const [saved, setSaved] = useState(false)
  const [newPreferred, setNewPreferred] = useState('')
  const [newAvoid, setNewAvoid] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setGuide(loadStyleGuide())
  }, [])

  const update = (key, value) => {
    setGuide(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveStyleGuide(guide)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addGlossaryTerm = () => {
    if (!newPreferred.trim() || !newAvoid.trim()) return
    update('glossary', [...guide.glossary, { preferred: newPreferred.trim(), avoid: newAvoid.trim() }])
    setNewPreferred('')
    setNewAvoid('')
  }

  const removeGlossaryTerm = (idx) => {
    update('glossary', guide.glossary.filter((_, i) => i !== idx))
  }

  const toggleSection = (key) => {
    update('templateSections', guide.templateSections.map(s =>
      s.key === key ? { ...s, enabled: !s.enabled } : s
    ))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200" style={{ background: '#FDF6E5' }}>
        <div className="max-w-screen-xl mx-auto px-8 py-12">
          <Link
            to="/"
            className="inline-block text-[10px] tracking-widest uppercase text-[#A8A295] mb-3 no-underline hover:text-black transition-colors"
            style={mono}
          >
            &larr; Home
          </Link>
          <p className="text-[10px] tracking-widest uppercase text-[#566F69] mb-2" style={mono}>
            Settings
          </p>
          <h1 className="text-3xl font-bold text-black mb-2">
            SOP Style Guide
          </h1>
          <p className="text-sm text-[#566F69] max-w-xl">
            Define the tone, voice, and structure for all AI-assisted SOP writing.
            This ensures every document reads like it came from the same playbook.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-10">
        <div className="max-w-2xl">

          {/* ── Formality ────────────────────────────── */}
          <Section title="Formality">
            <div className="space-y-2">
              {FORMALITY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    guide.formality === opt.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="formality"
                    value={opt.value}
                    checked={guide.formality === opt.value}
                    onChange={() => update('formality', opt.value)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black">{opt.label}</span>
                    <p className="text-xs text-[#566F69] mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Voice ────────────────────────────────── */}
          <Section title="Voice">
            <div className="space-y-2">
              {VOICE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    guide.voice === opt.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={opt.value}
                    checked={guide.voice === opt.value}
                    onChange={() => update('voice', opt.value)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black">{opt.label}</span>
                    <p className="text-xs text-[#797469] mt-0.5 italic">{opt.example}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Detail Level ─────────────────────────── */}
          <Section title="Detail Level">
            <div className="space-y-2">
              {DETAIL_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    guide.detailLevel === opt.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="detailLevel"
                    value={opt.value}
                    checked={guide.detailLevel === opt.value}
                    onChange={() => update('detailLevel', opt.value)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black">{opt.label}</span>
                    <p className="text-xs text-[#566F69] mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Industry Jargon ──────────────────────── */}
          <Section title="Terminology">
            <label className="flex items-center gap-3 p-3 border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="checkbox"
                checked={guide.useJargon}
                onChange={e => update('useJargon', e.target.checked)}
                className="accent-black"
              />
              <div>
                <span className="text-sm font-semibold text-black">Use industry jargon</span>
                <p className="text-xs text-[#566F69] mt-0.5">
                  When enabled, the AI will use domain-specific terms (e.g. "capital call", "accreditation").
                  When disabled, it will use plain language equivalents.
                </p>
              </div>
            </label>

            {/* Glossary */}
            <div className="mt-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#566F69] mb-3">
                Preferred Terms
              </p>
              <p className="text-xs text-[#797469] mb-3">
                Define preferred terminology. The AI will always use your preferred term instead of the alternative.
              </p>

              {guide.glossary.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {guide.glossary.map((term, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono bg-gray-100 px-2 py-1 border border-gray-200">
                        {term.preferred}
                      </span>
                      <span className="text-[#797469]">instead of</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 border border-gray-200 line-through text-[#797469]">
                        {term.avoid}
                      </span>
                      <button
                        onClick={() => removeGlossaryTerm(i)}
                        className="ml-auto text-[#797469] hover:text-red-500 transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPreferred}
                  onChange={e => setNewPreferred(e.target.value)}
                  placeholder="Preferred term"
                  className="flex-1 border border-gray-300 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-black"
                />
                <span className="text-xs text-[#797469]">not</span>
                <input
                  type="text"
                  value={newAvoid}
                  onChange={e => setNewAvoid(e.target.value)}
                  placeholder="Avoid this term"
                  className="flex-1 border border-gray-300 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-black"
                  onKeyDown={e => e.key === 'Enter' && addGlossaryTerm()}
                />
                <button
                  onClick={addGlossaryTerm}
                  disabled={!newPreferred.trim() || !newAvoid.trim()}
                  className="text-xs font-mono px-3 py-1.5 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </Section>

          {/* ── Template Sections ────────────────────── */}
          <Section title="Standard Sections">
            <p className="text-xs text-[#797469] mb-3">
              Choose which sections the AI includes by default when generating a new SOP.
            </p>
            <div className="space-y-1.5">
              {guide.templateSections.map(sec => (
                <label
                  key={sec.key}
                  className={`flex items-center gap-3 p-2.5 border cursor-pointer transition-colors ${
                    sec.enabled ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sec.enabled}
                    onChange={() => toggleSection(sec.key)}
                    className="accent-black"
                  />
                  <span className="text-sm text-black">{sec.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Custom Instructions ──────────────────── */}
          <Section title="Custom Instructions">
            <p className="text-xs text-[#797469] mb-3">
              Any additional rules the AI should follow when writing SOPs. These are applied to every generation.
            </p>
            <textarea
              value={guide.customInstructions}
              onChange={e => update('customInstructions', e.target.value)}
              placeholder="e.g. Use active voice. Keep sentences under 20 words. Always reference the responsible role by title, not name. Use 'shall' for requirements and 'should' for recommendations."
              rows={5}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-y"
            />
          </Section>

          {/* ── Preview ──────────────────────────────── */}
          <div className="mt-8 mb-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-mono text-[#27474D] hover:text-black transition-colors underline"
            >
              {showPreview ? 'Hide' : 'Preview'} AI prompt
            </button>
            {showPreview && (
              <pre className="mt-3 p-4 bg-gray-50 border border-gray-200 text-xs text-[#566F69] whitespace-pre-wrap font-mono overflow-x-auto">
                {buildStylePrompt(guide)}
              </pre>
            )}
          </div>

          {/* ── Save ──────────────────────────────────── */}
          <div className="flex items-center gap-4 py-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="text-xs font-mono bg-black text-white px-6 py-2.5 hover:bg-[#27474D] transition-colors"
            >
              Save Style Guide
            </button>
            {saved && (
              <span className="text-xs font-mono text-[#22c55e]">Saved</span>
            )}
            <button
              onClick={() => { setGuide({ ...DEFAULT_STYLE_GUIDE }); setSaved(false) }}
              className="text-xs font-mono text-[#797469] hover:text-black transition-colors ml-auto"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-6 text-center">
        <p className="text-[10px] text-[#797469] tracking-wider uppercase" style={mono}>
          Vega · procedures.vegarei.com · Confidential
        </p>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2
        className="text-[10px] font-bold tracking-widest uppercase text-[#27474D] mb-4 pb-2 border-b border-gray-200"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}
