import { useState } from 'react'
import { loadStyleGuide, buildStylePrompt } from '../lib/styleGuide'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function AiAssistPanel({ onInsert, onClose }) {
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const styleGuide = loadStyleGuide()

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    setResult('')

    // TODO: Wire up Claude API here
    // The style prompt is ready: buildStylePrompt(styleGuide)
    // For now, show a placeholder

    setTimeout(() => {
      setResult(
        `<p><em>AI generation will be wired up in the next session.</em></p>
<p>Your description: "${description}"</p>
<p>The style guide is configured and ready. The AI will use these settings:</p>
<ul>
<li>Formality: ${styleGuide.formality}</li>
<li>Voice: ${styleGuide.voice}</li>
<li>Detail Level: ${styleGuide.detailLevel}</li>
${styleGuide.customInstructions ? `<li>Custom instructions applied</li>` : ''}
${styleGuide.glossary.length > 0 ? `<li>${styleGuide.glossary.length} preferred term(s) enforced</li>` : ''}
</ul>`
      )
      setGenerating(false)
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#27474D] animate-pulse" />
            <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D]">
              AI Assist
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#797469] hover:text-black transition-colors"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto space-y-4">
          {/* Style guide indicator */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#566F69] bg-gray-50 px-3 py-2 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            Style guide active: {styleGuide.formality} · {styleGuide.voice} · {styleGuide.detailLevel}
          </div>

          {/* Description input */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              Describe the process
            </label>
            <textarea
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the process in plain English. e.g. 'We collect investor documents, verify their accreditation status, send out the subscription agreement for signature, then fund the deal once all docs are in.'"
              rows={4}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-y"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="w-full text-xs font-mono bg-black text-white px-4 py-2.5 hover:bg-[#27474D] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              'Generate SOP Content'
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-mono text-[#797469] uppercase tracking-widest">Preview</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div
                className="sop-document border border-gray-200 p-4 text-sm max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (result) onInsert(result); onClose() }}
            disabled={!result}
            className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
          >
            Insert into Editor
          </button>
        </div>
      </div>
    </div>
  )
}
