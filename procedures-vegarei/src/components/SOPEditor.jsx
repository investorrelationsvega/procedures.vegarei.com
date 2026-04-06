import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'
import { reconstructTemplate } from '../lib/sopTemplate'

const mono = { fontFamily: "'Space Mono', monospace" }

// ── Prompt matching the Vega_SOP_Generation_Template.docx ────

function buildFullPrompt(sopTitle) {
  return `You are helping me write a Standard Operating Procedure (SOP) for Vega Private Equity LLC, a real estate and private equity firm with eight business lines. I will describe a process and you will produce a complete, formatted SOP using the exact template and rules below.

SOP Title: "${sopTitle || 'Untitled'}"

WRITING RULES - follow these exactly, without exception:
- Use imperative voice. Write "Navigate to..." not "You should navigate to..."
- Use present tense throughout.
- No em dashes anywhere in the document. Use a colon or period instead.
- One action per step. The action goes on the first line. Supporting detail goes on the second line.
- Maker executes steps. Checker verifies. Label every step with one or the other.
- Write for a new operator who has never done this before. Assume nothing. Name every system, every field, every file format.
- Do not editorialize. Write only what the person doing the work needs to know.
- Spell out every abbreviation on first use.

STRUCTURE - produce all of the following sections in this order:

1. OVERVIEW
Purpose (2 to 4 sentences), trigger, definition of successful completion, key systems table (system / used for / who has access).

2. PROCEDURE STEPS
Numbered steps grouped into phases. Each step has: step number, action, detail (if needed), role (Maker or Checker), and system used.

3. COMPLETION CHECKLIST
Every item that must be confirmed before the process is closed. Assign each to Maker or Checker.

4. KEY CONTACTS
Every person or external party involved. Include name, role, and email or contact.

5. EXCEPTIONS AND EDGE CASES
Anything that can go wrong and what to do. If none are known, write "None identified at this time."

6. REVIEW SCHEDULE
State the review cycle and next review date.

TONE - the Vega voice:
- Direct. Institutional. No filler words. No exclamation points.
- Every sentence earns its place. If it does not tell the operator what to do or why it matters, cut it.
- Precision over brevity. If a step needs three lines to be unambiguous, use three lines.

Return each section with its numbered heading exactly as shown above. If missing information, write [PENDING: describe what is needed].

Now describe the process you want to document:
[DESCRIBE YOUR PROCESS HERE]`
}

// ── Section config ───────────────────────────────────────────

const SECTION_HEADINGS = {
  'overview': '1. Overview',
  'procedure': '2. Procedure Steps',
  'completion-checklist': '3. Completion Checklist',
  'key-contacts': '4. Key Contacts',
  'exceptions': '5. Exceptions and Edge Cases',
  'review-schedule': '6. Review Schedule',
  'revision-history': '7. Revision History',
}

const ORDERED_SECTIONS = ['overview', 'procedure', 'completion-checklist', 'key-contacts', 'exceptions', 'review-schedule']

// ── Parse AI response into sections ──────────────────────────

function detectSectionId(line) {
  const l = line.trim()
  if (/^\d+\.\s*OVERVIEW/i.test(l)) return 'overview'
  if (/^\d+\.\s*PROCEDURE/i.test(l)) return 'procedure'
  if (/^\d+\.\s*COMPLETION/i.test(l)) return 'completion-checklist'
  if (/^\d+\.\s*KEY\s*CONTACT/i.test(l)) return 'key-contacts'
  if (/^\d+\.\s*EXCEPTION/i.test(l)) return 'exceptions'
  if (/^\d+\.\s*REVIEW\s*SCHEDULE/i.test(l)) return 'review-schedule'
  if (/^\d+\.\s*REVISION/i.test(l)) return 'revision-history'
  // Also match old template headings
  if (/^\d+\.\s*PURPOSE\s*AND\s*SCOPE/i.test(l)) return 'overview'
  if (/^\d+\.\s*DEFINITION/i.test(l)) return 'overview'
  if (/^\d+\.\s*RISK/i.test(l)) return 'exceptions'
  if (/^\d+\.\s*ESCALATION/i.test(l)) return 'exceptions'
  if (/^\d+\.\s*COMPLIANCE/i.test(l)) return 'exceptions'
  if (/^\d+\.\s*APPROVAL/i.test(l)) return 'key-contacts'
  if (/^\d+\.\s*SOP\s*IDENTIFICATION/i.test(l)) return 'sop-id'
  return null
}

function parseAiResponse(text) {
  const sectionContent = {}
  const lines = text.split('\n')
  let currentId = null
  let currentLines = []

  function flush() {
    if (currentId && currentId !== 'sop-id' && currentLines.length > 0) {
      const content = currentLines.join('\n').trim()
      if (content) {
        const html = content.split(/\n{2,}/).map(p =>
          `<p>${p.trim().replace(/\n/g, '<br>')}</p>`
        ).join('\n')
        // Append if section already has content (e.g. multiple old sections map to one new section)
        sectionContent[currentId] = sectionContent[currentId]
          ? sectionContent[currentId] + '\n' + html
          : html
      }
    }
    currentLines = []
  }

  for (const line of lines) {
    const sid = detectSectionId(line)
    if (sid) {
      flush()
      currentId = sid
      continue
    }
    if (currentId) {
      currentLines.push(line)
    }
  }
  flush()

  return sectionContent
}

// ── Parse existing HTML into section content ─────────────────

function sectionIdFromHeading(text) {
  const n = text.replace(/^\d+\.\s*/, '').trim().toLowerCase()
  if (n.includes('overview') || (n.includes('purpose') && n.includes('scope'))) return 'overview'
  if (n.includes('procedure')) return 'procedure'
  if (n.includes('completion') || n.includes('checklist')) return 'completion-checklist'
  if (n.includes('key contact')) return 'key-contacts'
  if (n.includes('exception') || n.includes('edge case')) return 'exceptions'
  if (n.includes('risk') && n.includes('control')) return 'exceptions'
  if (n.includes('escalation')) return 'exceptions'
  if (n.includes('review schedule')) return 'review-schedule'
  if (n.includes('revision history')) return 'revision-history'
  if (n.includes('definition')) return 'overview'
  if (n.includes('compliance')) return 'exceptions'
  if (n.includes('approval')) return 'key-contacts'
  return null
}

const PLACEHOLDER_PHRASES = [
  '[AI:',
  '[PENDING:',
  'State why this SOP exists',
  'Define what this SOP covers',
  'List any terms that someone unfamiliar',
  'Provide a brief summary of the end-to-end process',
  'Document each step of the process in the order',
  'Describe the action in one clear sentence',
  'Identify what could go wrong during this process',
  'Before closing out this process, confirm every item',
  'This SOP has been reviewed and approved by the following',
  'Phase Title',
]

function isPlaceholderContent(text) {
  return PLACEHOLDER_PHRASES.some(phrase => text.includes(phrase))
}

function parseExistingContent(html) {
  if (!html) return { preamble: '', sectionContent: {}, revisionHtml: '' }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild

  const docBody = root.querySelector('.doc-body')
  let preamble = ''
  if (docBody) {
    const clone = root.cloneNode(true)
    const cloneBody = clone.querySelector('.doc-body')
    if (cloneBody) cloneBody.remove()
    preamble = clone.innerHTML
  }

  const bodyRoot = docBody || root
  const h2s = [...bodyRoot.querySelectorAll('h2')]
  const sectionContent = {}
  let revisionHtml = ''

  for (let i = 0; i < h2s.length; i++) {
    const h2 = h2s[i]
    const headingText = h2.textContent.trim()
    const sid = sectionIdFromHeading(headingText)

    const contentEls = []
    let el = h2.nextSibling
    const nextH2 = h2s[i + 1] || null
    while (el && el !== nextH2) {
      contentEls.push(el.outerHTML || el.textContent)
      el = el.nextSibling
    }

    const contentHtml = contentEls.join('')
    const contentText = contentEls.map(h => {
      const tmp = document.createElement('div')
      tmp.innerHTML = h
      return tmp.textContent
    }).join(' ').trim()

    if (sid === 'revision-history') {
      revisionHtml = contentHtml
    } else if (sid && !isPlaceholderContent(contentText) && contentText.length > 0) {
      sectionContent[sid] = sectionContent[sid]
        ? sectionContent[sid] + '\n' + contentHtml
        : contentHtml
    }
  }

  return { preamble, sectionContent, revisionHtml }
}

function reassembleHtml(preamble, sectionContent, revisionHtml) {
  let body = ''
  for (const id of ORDERED_SECTIONS) {
    if (sectionContent[id]) {
      body += `<h2>${SECTION_HEADINGS[id]}</h2>\n${sectionContent[id]}\n\n`
    }
  }
  body += `<h2>7. Revision History</h2>\n${revisionHtml || '<table class="rev-table"><thead><tr><th style="width:65px;">Version</th><th style="width:110px;">Date</th><th style="width:130px;">Author</th><th>Changes</th></tr></thead><tbody><tr><td>1.0</td><td></td><td></td><td>Initial publication</td></tr></tbody></table>'}\n`
  return `${preamble}\n<div class="doc-body">\n${body}</div>`
}

// ── Main Editor ──────────────────────────────────────────────

export default function SOPEditor({ docId, title, accessToken, onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const isGoogleDoc = useRef(false)

  const [preamble, setPreamble] = useState('')
  const [sectionContent, setSectionContent] = useState({})
  const [revisionHtml, setRevisionHtml] = useState('')

  const [userInput, setUserInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [parsed, setParsed] = useState(false)

  // Load content from Drive
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let html
        try {
          html = await fetchDocContent(docId, accessToken)
          isGoogleDoc.current = true
        } catch {
          try {
            html = await exportGoogleDocAsHtml(docId, accessToken)
            isGoogleDoc.current = true
          } catch {
            html = await fetchDriveFile(docId, accessToken)
            isGoogleDoc.current = false
          }
        }
        const reconstructed = reconstructTemplate(html)
        const existing = parseExistingContent(reconstructed)
        setPreamble(existing.preamble)
        setSectionContent(existing.sectionContent)
        setRevisionHtml(existing.revisionHtml)

        if (Object.keys(existing.sectionContent).length > 0) {
          setParsed(true)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId, accessToken])

  const handleCopyPrompt = useCallback(() => {
    const prompt = buildFullPrompt(title)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [title])

  const handleParse = useCallback(() => {
    if (!userInput.trim()) return
    const sections = parseAiResponse(userInput)
    if (Object.keys(sections).length === 0) {
      const html = userInput.trim().split(/\n{2,}/).map(p =>
        `<p>${p.trim().replace(/\n/g, '<br>')}</p>`
      ).join('\n')
      setSectionContent(prev => ({ ...prev, overview: html }))
    } else {
      setSectionContent(prev => ({ ...prev, ...sections }))
    }
    setParsed(true)
  }, [userInput])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const fullHtml = reassembleHtml(preamble, sectionContent, revisionHtml)
      if (isGoogleDoc.current) {
        await saveDocContent(docId, fullHtml, accessToken)
      } else {
        await saveSopHtml(docId, fullHtml, accessToken)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [docId, accessToken, preamble, sectionContent, revisionHtml])

  const handleCancel = useCallback(() => {
    if ((userInput.trim() || Object.keys(sectionContent).length > 0) && !confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }, [userInput, sectionContent, onClose])

  const filledCount = Object.keys(sectionContent).filter(k => ORDERED_SECTIONS.includes(k)).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center px-6 py-3 border-b border-gray-200 bg-gray-50">
        <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D] mr-4">
          {title || 'Edit SOP'}
        </span>

        {parsed && (
          <span className="text-[10px] font-mono text-gray-400">
            {filledCount} section{filledCount !== 1 ? 's' : ''} filled
          </span>
        )}

        <div className="flex-1" />

        {error && (
          <span className="text-xs text-red-600 mr-3">{error}</span>
        )}

        <button
          onClick={handleCancel}
          className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors mr-2"
        >
          Cancel
        </button>
        {parsed && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save & Close'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-3" />
            <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading...</span>
          </div>
        ) : !parsed ? (
          /* ── Input view ── */
          <div className="max-w-2xl mx-auto px-8 py-12">
            <h2 className="text-xl font-bold text-[#111] mb-2">Describe your process</h2>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Copy the prompt below and paste it into your preferred AI (ChatGPT, Gemini, Claude, or any other).
              Describe your process to the AI, then copy its response and paste it here.
              The system will organize it into the SOP template automatically.
            </p>

            {/* Step 1 */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#27474D] text-white text-xs font-bold flex-shrink-0">1</div>
              <span className="text-sm text-[#111] font-medium flex-1">Copy the prompt and paste it into your AI</span>
              <button
                onClick={handleCopyPrompt}
                className="text-xs font-mono px-4 py-2 border border-[#27474D] text-[#27474D] hover:bg-[#27474D] hover:text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#27474D] text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <span className="text-sm text-[#111] font-medium">Paste the AI's response here</span>
            </div>

            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Paste the AI's organized response here..."
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#27474D] transition-colors resize-none mb-4"
              rows={16}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="text-xs font-mono px-4 py-2 text-gray-400 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!userInput.trim()}
                className="text-xs font-mono px-5 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Review view ── */
          <div className="max-w-3xl mx-auto px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#111] mb-1">Review your SOP</h2>
                <p className="text-sm text-gray-600">
                  {filledCount} section{filledCount !== 1 ? 's' : ''} filled. Review the content below, then save.
                </p>
              </div>
              <button
                onClick={() => setParsed(false)}
                className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
              >
                Back to Input
              </button>
            </div>

            <div className="sop-document">
              <div dangerouslySetInnerHTML={{ __html: preamble }} className="mb-6 opacity-60" />
              <div className="doc-body">
                {ORDERED_SECTIONS.map(id => {
                  const content = sectionContent[id]
                  if (!content) return null
                  return (
                    <div key={id} className="mb-6">
                      <h2>{SECTION_HEADINGS[id]}</h2>
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                  )
                })}
              </div>
            </div>

            {filledCount < ORDERED_SECTIONS.length && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <div style={mono} className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Sections not yet filled
                </div>
                <div className="flex flex-wrap gap-2">
                  {ORDERED_SECTIONS.filter(id => !sectionContent[id]).map(id => (
                    <span key={id} className="text-xs text-gray-400 font-mono">{SECTION_HEADINGS[id]}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">You can fill these in later by editing the SOP again.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => setParsed(false)}
                className="text-xs font-mono px-4 py-2 text-gray-400 hover:text-black transition-colors"
              >
                Back to Input
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-mono px-5 py-2 bg-[#22c55e] text-white hover:bg-[#16a34a] transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
