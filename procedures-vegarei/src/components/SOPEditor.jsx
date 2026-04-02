import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'
import { reconstructTemplate } from '../lib/sopTemplate'

const mono = { fontFamily: "'Space Mono', monospace" }

// ── Build the all-in-one prompt ──────────────────────────────

function buildFullPrompt(sopTitle) {
  return `I need you to help me write a Standard Operating Procedure (SOP) titled "${sopTitle || 'Untitled'}".

I will describe the process in my own words below. Please take my description and organize it into the following sections. For each section, write clean, professional content based on what I provide. If I did not include information for a section, skip it.

SECTIONS TO FILL:

1. PURPOSE AND SCOPE
Write why this SOP exists (1-2 sentences) and what it covers and does not cover.

2. DEFINITIONS
List any acronyms, software names, role titles, industry terms, or internal shorthand mentioned. Format as "Term - Definition" with one per line.

3. OVERVIEW
Summarize the full process, state what triggers it, and list the systems used.

4. PROCEDURE
List each step in order. For each step write:
Step [number]: [Action description] (Maker or Checker)
- Maker = the person executing the step
- Checker = the person verifying/reviewing

5. RISKS AND CONTROLS
List what could go wrong and what prevents it. Format as:
Risk: [what could go wrong]
Control: [what prevents or catches it]

6. ESCALATION PATH
Who to contact when something goes wrong. Format as:
[Situation]: [Contact person/role] within [timeframe]

7. COMPLIANCE REFERENCES
List any regulations, policies, or legal requirements. If none, write "No specific regulatory requirements. This SOP follows internal best practices."

8. COMPLETION CHECKLIST
List items to verify before the process is done, each marked (Maker) or (Checker).

9. KEY CONTACTS
List everyone involved with their name, email/phone, and role.

10. APPROVAL
List who prepared, reviewed, and approved this SOP.

11. REVIEW SCHEDULE
State how often this SOP should be reviewed (default: quarterly).

WRITING RULES:
- Write in direct, imperative, present tense ("Navigate to..." not "The user should navigate to...")
- Professional but readable
- Do not use em dashes. Use regular dashes or rewrite.
- Be specific and thorough
- Keep sentences concise

Return each section with its numbered heading exactly as shown above (e.g. "1. PURPOSE AND SCOPE"). I will paste your response directly into my SOP system.

HERE IS MY DESCRIPTION OF THE PROCESS:
[DESCRIBE YOUR PROCESS HERE - be as detailed as you can about what happens, who does it, what systems you use, and in what order]`
}

// ── Parse AI response into section content ───────────────────

const SECTION_MAP = [
  { pattern: /1\.\s*PURPOSE\s*AND\s*SCOPE/i, id: 'purpose-and-scope', heading: '1. Purpose and Scope' },
  { pattern: /2\.\s*DEFINITIONS?/i, id: 'definitions', heading: '2. Definitions' },
  { pattern: /3\.\s*OVERVIEW/i, id: 'overview', heading: '3. Overview' },
  { pattern: /4\.\s*PROCEDURE/i, id: 'procedure', heading: '4. Procedure' },
  { pattern: /5\.\s*RISKS?\s*AND\s*CONTROLS?/i, id: 'risks-and-controls', heading: '5. Risks and Controls' },
  { pattern: /6\.\s*ESCALATION\s*PATH/i, id: 'escalation-path', heading: '6. Escalation Path' },
  { pattern: /7\.\s*COMPLIANCE\s*REFERENCES?/i, id: 'compliance-references', heading: '7. Compliance References' },
  { pattern: /8\.\s*COMPLETION\s*CHECKLIST/i, id: 'completion-checklist', heading: '8. Completion Checklist' },
  { pattern: /9\.\s*KEY\s*CONTACTS?/i, id: 'key-contacts', heading: '9. Key Contacts' },
  { pattern: /10\.\s*APPROVAL/i, id: 'approval', heading: '10. Approval' },
  { pattern: /11\.\s*REVIEW\s*SCHEDULE/i, id: 'review-schedule', heading: '11. Review Schedule' },
]

function parseAiResponse(text) {
  const sectionContent = {}
  const lines = text.split('\n')
  let currentId = null
  let currentLines = []

  function flush() {
    if (currentId && currentLines.length > 0) {
      const content = currentLines.join('\n').trim()
      if (content) {
        const html = content.split(/\n{2,}/).map(p =>
          `<p>${p.trim().replace(/\n/g, '<br>')}</p>`
        ).join('\n')
        sectionContent[currentId] = html
      }
    }
    currentLines = []
  }

  for (const line of lines) {
    let matched = false
    for (const sec of SECTION_MAP) {
      if (sec.pattern.test(line.trim())) {
        flush()
        currentId = sec.id
        matched = true
        break
      }
    }
    if (!matched && currentId) {
      currentLines.push(line)
    }
  }
  flush()

  return sectionContent
}

// ── Parse existing HTML into section content ─────────────────

function sectionIdFromHeading(text) {
  const n = text.replace(/^\d+\.\s*/, '').trim().toLowerCase()
  if (n.includes('purpose') && n.includes('scope')) return 'purpose-and-scope'
  if (n.includes('definition')) return 'definitions'
  if (n.includes('overview')) return 'overview'
  if (n.includes('procedure')) return 'procedure'
  if (n.includes('risk') && n.includes('control')) return 'risks-and-controls'
  if (n.includes('escalation')) return 'escalation-path'
  if (n.includes('compliance')) return 'compliance-references'
  if (n.includes('completion') || n.includes('checklist')) return 'completion-checklist'
  if (n.includes('key contact')) return 'key-contacts'
  if (n.includes('approval')) return 'approval'
  if (n.includes('review schedule')) return 'review-schedule'
  if (n.includes('revision history')) return 'revision-history'
  return null
}

const PLACEHOLDER_PHRASES = [
  'State why this SOP exists',
  'Define what this SOP covers',
  'List any terms that someone unfamiliar',
  'The kinds of terms to include',
  'Provide a brief summary of the end-to-end process',
  'What event kicks off this process? Be specific',
  'Document each step of the process in the order',
  'Describe the action in one clear sentence',
  'Identify what could go wrong during this process',
  'Describe who to contact and what to do when something goes wrong',
  'List any regulations, internal policies, legal requirements',
  'Before closing out this process, confirm every item',
  'This SOP has been reviewed and approved by the following',
  'Phase Title',
  'Add any supporting detail: where to find something',
  'Verify the previous step before proceeding',
  'Describe what to check and what to do if something does not match',
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
      sectionContent[sid] = contentHtml
    }
  }

  return { preamble, sectionContent, revisionHtml }
}

function reassembleHtml(preamble, sectionContent, revisionHtml) {
  let body = ''
  for (const sec of SECTION_MAP) {
    if (sectionContent[sec.id]) {
      body += `<h2>${sec.heading}</h2>\n${sectionContent[sec.id]}\n\n`
    }
  }
  body += `<h2>12. Revision History</h2>\n${revisionHtml || '<table class="rev-table"><thead><tr><th style="width:65px;">Version</th><th style="width:110px;">Date</th><th style="width:130px;">Author</th><th>Changes</th></tr></thead><tbody><tr><td>1.0</td><td></td><td></td><td>Initial publication</td></tr></tbody></table>'}\n`
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

        // If there is existing content, show it as pre-parsed
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
      // If parsing found no sections, treat the whole input as the overview
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

  const filledSections = Object.keys(sectionContent)
  const filledCount = filledSections.length

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
          /* ── Input view ──────────────────────────────── */
          <div className="max-w-2xl mx-auto px-8 py-12">
            <h2 className="text-xl font-bold text-[#111] mb-2">Describe your process</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Copy the prompt below and paste it into your preferred AI (ChatGPT, Gemini, Claude, or any other).
              Add your description of the process, then copy the AI's response and paste it back here.
              The system will organize it into the SOP template automatically.
            </p>

            {/* Step 1: Copy prompt */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#27474D] text-white text-xs font-bold flex-shrink-0">1</div>
              <span className="text-sm text-[#111] font-medium">Copy the prompt and paste it into your AI</span>
              <div className="flex-1" />
              <button
                onClick={handleCopyPrompt}
                className="text-xs font-mono px-4 py-2 border border-[#27474D] text-[#27474D] hover:bg-[#27474D] hover:text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>

            {/* Step 2: Describe process */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#27474D] text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <span className="text-sm text-[#111] font-medium">Describe your process to the AI, then paste its response here</span>
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
          /* ── Review view ──────────────────────────────── */
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

            {/* Show filled sections */}
            <div className="sop-document">
              <div dangerouslySetInnerHTML={{ __html: preamble }} className="mb-6 opacity-60" />
              <div className="doc-body">
                {SECTION_MAP.map(sec => {
                  const content = sectionContent[sec.id]
                  if (!content) return null
                  return (
                    <div key={sec.id} className="mb-6">
                      <h2>{sec.heading}</h2>
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Empty sections note */}
            {filledCount < SECTION_MAP.length && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <div style={mono} className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Sections not yet filled
                </div>
                <div className="flex flex-wrap gap-2">
                  {SECTION_MAP.filter(s => !sectionContent[s.id]).map(s => (
                    <span key={s.id} className="text-xs text-gray-400 font-mono">{s.heading}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">You can come back and fill these in later by editing the SOP.</p>
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
