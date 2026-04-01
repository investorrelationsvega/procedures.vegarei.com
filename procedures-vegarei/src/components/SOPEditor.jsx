import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'
import { reconstructTemplate } from '../lib/sopTemplate'
import { checkGrammar, isGeminiAvailable, generateSectionDraft } from '../services/geminiService'

const mono = { fontFamily: "'Space Mono', monospace" }

// ── Section definitions with guidance text ──────────────────
// Each section has an id, heading, and guidance that appears as
// a collapsible banner above the editable area.

const SECTION_GUIDANCE = {
  'purpose-and-scope': {
    heading: '1. Purpose and Scope',
    guidance: `Purpose: State why this SOP exists in one to two sentences. What business need does it address?\nExample: "This SOP ensures consistent and accurate processing of monthly investor distributions for all Vega Assisted Living Fund II, L.P. limited partners."\n\nScope: Define what this SOP covers and what it does not. Be specific about boundaries.\nExample: "Covers all Class A and Class B limited partner distributions. Does not cover GP distributions, special allocations, or one-time redemption payments."`,
  },
  'definitions': {
    heading: '2. Definitions',
    guidance: `List terms that someone unfamiliar with this process would need to understand. Think about a new employee on their first day. Include:\n- Acronyms your team uses (e.g. NAV, ACH, AUM, LP, GP, K-1)\n- Software and system names (e.g. Syndication Pro, Juniper Square, QuickBooks)\n- Role titles that may not be obvious (e.g. Fund Controller, IR Associate)\n- Industry or financial terms (e.g. capital call, waterfall, preferred return)\n- Internal shorthand your team uses day to day`,
  },
  'overview': {
    heading: '3. Overview',
    guidance: `Summarize the end-to-end process in plain language. Someone should be able to read this section and understand the full picture.\n\nTrigger: What event kicks off this process? Be specific. Examples: "The first business day of each month," "When a new subscription agreement is received."\n\nKey Systems: List each system used, what it is used for, and how to access it.`,
  },
  'procedure': {
    heading: '4. Procedure',
    guidance: `Document each step in the order it happens. Be specific enough that someone could follow these without asking for help.\n- Use Maker for the person executing the step\n- Use Checker for the person verifying it\n- Group steps into phases if there are distinct stages\n- Write in imperative present tense: "Navigate to..." not "The user should navigate to..."`,
  },
  'risks-and-controls': {
    heading: '5. Risks and Controls',
    guidance: `Identify what could go wrong and what safeguards prevent it. Think worst-case: wrong numbers, missed deadlines, unauthorized access, data sent to the wrong person.\n\nExample:\nRisk: Incorrect distribution amount sent to an investor\nControl: Checker independently verifies all amounts against the NAV report before any payment is released`,
  },
  'escalation-path': {
    heading: '6. Escalation Path',
    guidance: `Who to contact when something goes wrong. Include names, roles, and timeframes.\n\nExample:\n- Distribution discrepancy exceeds $500: Notify Fund Controller within one business day\n- Issue unresolved after 48 hours: Escalate to Managing Partner immediately`,
  },
  'compliance-references': {
    heading: '7. Compliance References',
    guidance: `List regulations, internal policies, or legal requirements this SOP relates to. If none apply, write "No specific regulatory requirements. This SOP follows internal best practices."\n\nExample: SEC Rule 206(4)-7, Fund LPA Section 8.3, Vega Internal Policy 4.2`,
  },
  'completion-checklist': {
    heading: '8. Completion Checklist',
    guidance: `List items to verify before closing out this process. Each item should be a simple yes/no check. Assign each to Maker or Checker.`,
  },
  'key-contacts': {
    heading: '9. Key Contacts',
    guidance: `List everyone involved in this process with their name, contact info, and role. Include the Maker, Checker, and any external parties.`,
  },
  'approval': {
    heading: '10. Approval',
    guidance: `Sign-off block confirming who reviewed and approved this SOP. Include Prepared By (Maker), Reviewed By (Checker), and Approved By.`,
  },
  'review-schedule': {
    heading: '11. Review Schedule',
    guidance: `Standard language: reviewed quarterly (March 31, June 30, September 30, December 31) and upon any material change. You can adjust the cadence if needed.`,
  },
  'revision-history': {
    heading: '12. Revision History',
    guidance: `Tracks all changes to this SOP. Version 1.0 is the initial publication. Add a row each time the SOP is updated.`,
  },
}

// Map section heading text to section id
function sectionIdFromHeading(text) {
  const normalized = text.replace(/^\d+\.\s*/, '').trim().toLowerCase()
  if (normalized.includes('purpose') && normalized.includes('scope')) return 'purpose-and-scope'
  if (normalized.includes('definition')) return 'definitions'
  if (normalized.includes('overview')) return 'overview'
  if (normalized.includes('procedure')) return 'procedure'
  if (normalized.includes('risk') && normalized.includes('control')) return 'risks-and-controls'
  if (normalized.includes('escalation')) return 'escalation-path'
  if (normalized.includes('compliance')) return 'compliance-references'
  if (normalized.includes('completion') || normalized.includes('checklist')) return 'completion-checklist'
  if (normalized.includes('key contact')) return 'key-contacts'
  if (normalized.includes('approval')) return 'approval'
  if (normalized.includes('review schedule')) return 'review-schedule'
  if (normalized.includes('revision history')) return 'revision-history'
  return null
}

// Parse loaded HTML into header/meta and section blocks
function parseIntoSections(html) {
  if (!html) return { preamble: '', sections: [] }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild

  // Extract everything before .doc-body as preamble (header, title, meta)
  const docBody = root.querySelector('.doc-body')
  let preamble = ''
  if (docBody) {
    // Clone root, remove doc-body, get remaining HTML
    const clone = root.cloneNode(true)
    const cloneBody = clone.querySelector('.doc-body')
    if (cloneBody) cloneBody.remove()
    preamble = clone.innerHTML
  } else {
    // No doc-body wrapper - everything before first h2 is preamble
    const firstH2 = root.querySelector('h2')
    if (firstH2) {
      const preambleEls = []
      let el = root.firstChild
      while (el && el !== firstH2) {
        preambleEls.push(el.outerHTML || el.textContent)
        el = el.nextSibling
      }
      preamble = preambleEls.join('')
    } else {
      return { preamble: html, sections: [] }
    }
  }

  // Parse doc-body (or full content) into sections by h2
  const bodyRoot = docBody || root
  const h2s = [...bodyRoot.querySelectorAll('h2')]
  const sections = []

  for (let i = 0; i < h2s.length; i++) {
    const h2 = h2s[i]
    const headingText = h2.textContent.trim()
    const sectionId = sectionIdFromHeading(headingText)

    // Collect content between this h2 and the next
    const contentEls = []
    let el = h2.nextSibling
    const nextH2 = h2s[i + 1] || null
    while (el && el !== nextH2) {
      contentEls.push(el.outerHTML || el.textContent)
      el = el.nextSibling
    }

    const contentHtml = contentEls.join('')

    // Check if content is only placeholder text
    const contentText = contentEls.map(h => {
      const tmp = document.createElement('div')
      tmp.innerHTML = h
      return tmp.textContent
    }).join(' ').trim()

    const isPlaceholder = isPlaceholderContent(contentText)

    sections.push({
      id: sectionId || `section-${i}`,
      heading: headingText,
      contentHtml: isPlaceholder ? '' : contentHtml,
      hasContent: !isPlaceholder,
    })
  }

  return { preamble, sections }
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

// Reassemble sections back into full template HTML
function reassembleHtml(preamble, sections) {
  let body = ''
  for (const section of sections) {
    body += `<h2>${section.heading}</h2>\n${section.contentHtml}\n\n`
  }
  return `${preamble}\n<div class="doc-body">\n${body}</div>`
}

// ── Section Editor Component ─────────────────────────────────
function SectionBlock({ section, guidance, onChange, onAiHelp, aiLoading }) {
  const editorRef = useRef(null)
  const [showGuide, setShowGuide] = useState(!section.hasContent)

  useEffect(() => {
    if (editorRef.current && section.contentHtml) {
      editorRef.current.innerHTML = section.contentHtml
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(section.id, editorRef.current.innerHTML)
    }
  }

  return (
    <div className="mb-6">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-mono text-[7.5pt] font-bold tracking-[0.22em] uppercase text-[#111] border-b-[1.5px] border-[#111] pb-1 flex-1">
          {section.heading}
        </h2>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-[10px] font-mono text-gray-400 hover:text-[#6366f1] transition-colors px-2 py-0.5 flex-shrink-0"
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
      </div>

      {/* Guidance banner */}
      {showGuide && guidance && (
        <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <pre className="text-xs text-gray-500 whitespace-pre-wrap font-sans leading-relaxed flex-1">{guidance.guidance}</pre>
            {isGeminiAvailable() && (
              <button
                onClick={() => onAiHelp(section.id, guidance.guidance)}
                disabled={aiLoading}
                className="text-[10px] font-mono border border-[#6366f1]/30 text-[#6366f1] px-2.5 py-1 hover:border-[#6366f1] hover:bg-[#6366f1]/5 transition-colors flex-shrink-0 flex items-center gap-1.5"
              >
                {aiLoading ? (
                  <>
                    <span className="w-2 h-2 border border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
                    Writing...
                  </>
                ) : (
                  'AI Draft'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editable content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Type here..."
        className="sop-document min-h-[60px] focus:outline-none border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
      />
    </div>
  )
}

// ── Main Editor ──────────────────────────────────────────────

export default function SOPEditor({ docId, title, accessToken, onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const isGoogleDoc = useRef(false)

  const [preamble, setPreamble] = useState('')
  const [sections, setSections] = useState([])

  // Grammar check state
  const [checking, setChecking] = useState(false)
  const [grammarChanges, setGrammarChanges] = useState(null)

  // AI draft loading state (per section)
  const [aiLoadingSection, setAiLoadingSection] = useState(null)

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
        const parsed = parseIntoSections(reconstructed)
        setPreamble(parsed.preamble)
        setSections(parsed.sections)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId, accessToken])

  const handleSectionChange = useCallback((sectionId, newHtml) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, contentHtml: newHtml, hasContent: true } : s
    ))
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const fullHtml = reassembleHtml(preamble, sections)
      if (isGoogleDoc.current) {
        await saveDocContent(docId, fullHtml, accessToken)
      } else {
        await saveSopHtml(docId, fullHtml, accessToken)
      }
      setDirty(false)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [docId, accessToken, preamble, sections])

  const handleCancel = useCallback(() => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }, [dirty, onClose])

  const handleGrammarCheck = useCallback(async () => {
    setChecking(true)
    setError(null)
    setGrammarChanges(null)
    try {
      const allText = sections.map(s => {
        const tmp = document.createElement('div')
        tmp.innerHTML = s.contentHtml
        return `${s.heading}:\n${tmp.textContent}`
      }).filter(t => t.trim()).join('\n\n')
      const result = await checkGrammar(allText)
      setGrammarChanges(result.changes)
    } catch (err) {
      setError('Grammar check failed: ' + err.message)
    } finally {
      setChecking(false)
    }
  }, [sections])

  const handleAiHelp = useCallback(async (sectionId, guidanceText) => {
    setAiLoadingSection(sectionId)
    setError(null)
    try {
      const result = await generateSectionDraft(sectionId, guidanceText, title)
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, contentHtml: result, hasContent: true } : s
      ))
      setDirty(true)
    } catch (err) {
      setError('AI draft failed: ' + err.message)
    } finally {
      setAiLoadingSection(null)
    }
  }, [title])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 px-6 py-3 border-b border-gray-200 bg-gray-50 items-center">
        <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D] mr-4">
          {title || 'Edit SOP'}
        </span>

        <ToolbarButton label="B" onClick={() => document.execCommand('bold')} title="Bold" style={{ fontWeight: 700 }} />
        <ToolbarButton label="I" onClick={() => document.execCommand('italic')} title="Italic" style={{ fontStyle: 'italic' }} />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="List" onClick={() => document.execCommand('insertUnorderedList')} title="Bullet list" />
        <ToolbarButton label="Table" onClick={insertTable} title="Insert table" />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="Undo" onClick={() => document.execCommand('undo')} title="Undo" />
        <ToolbarButton label="Redo" onClick={() => document.execCommand('redo')} title="Redo" />

        {isGeminiAvailable() && (
          <>
            <div className="w-px bg-gray-300 mx-1 self-stretch" />
            <button
              onClick={handleGrammarCheck}
              disabled={checking}
              title="Check grammar, spelling, and tone across all sections"
              className="px-2.5 py-1.5 text-xs font-mono border border-[#6366f1]/30 text-[#6366f1] hover:border-[#6366f1] hover:bg-[#6366f1]/5 transition-colors flex items-center gap-1.5"
            >
              {checking ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
                  Polishing...
                </>
              ) : (
                'Polish with Gemini'
              )}
            </button>
          </>
        )}

        <div className="flex-1" />

        {error && (
          <span className="text-xs text-red-600 mr-2">{error}</span>
        )}

        <button
          onClick={handleCancel}
          className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Grammar check results panel */}
      {grammarChanges && grammarChanges.length > 0 && (
        <div className="border-b border-[#6366f1]/20 bg-[#6366f1]/5 px-6 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div style={mono} className="text-[10px] uppercase tracking-wider text-[#6366f1] font-bold mb-2">
                Writing Review
              </div>
              {grammarChanges[0] === 'No corrections needed.' ? (
                <p className="text-xs text-[#22c55e] font-mono">No issues found. Your writing looks good.</p>
              ) : (
                <>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {grammarChanges.map((change, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#6366f1] flex-shrink-0">-</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-500 mt-2 font-mono">Review the suggestions above and make corrections in each section.</p>
                </>
              )}
            </div>
            <button
              onClick={() => setGrammarChanges(null)}
              className="text-xs font-mono text-gray-400 hover:text-black px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Section-based editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-8 py-10">
          <div className="max-w-3xl">
            {loading ? (
              <div className="flex items-center gap-3 py-20">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading...</span>
              </div>
            ) : (
              <>
                {/* Preamble (header, title, meta) - read-only preview */}
                <div className="sop-document mb-8 opacity-60 pointer-events-none" dangerouslySetInnerHTML={{ __html: preamble }} />

                {/* Editable sections */}
                {sections.map(section => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    guidance={SECTION_GUIDANCE[section.id]}
                    onChange={handleSectionChange}
                    onAiHelp={handleAiHelp}
                    aiLoading={aiLoadingSection === section.id}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
