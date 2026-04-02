import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'
import { reconstructTemplate } from '../lib/sopTemplate'

const mono = { fontFamily: "'Space Mono', monospace" }

// ── Section wizard steps ────────────────────────────────────

const WIZARD_STEPS = [
  {
    id: 'purpose-and-scope',
    heading: '1. Purpose and Scope',
    question: 'What is the purpose of this SOP, and what does it cover?',
    guide: 'State why this SOP exists in one to two sentences, then define what it covers and what it does not. Be specific about boundaries.\n\nExample:\nPurpose: "This SOP ensures consistent and accurate processing of monthly investor distributions for all Vega Assisted Living Fund II, L.P. limited partners."\n\nScope: "Covers all Class A and Class B limited partner distributions processed through Juniper Square. Does not cover GP distributions, special allocations, or one-time redemption payments."',
  },
  {
    id: 'definitions',
    heading: '2. Definitions',
    question: 'What terms, acronyms, or systems would someone need to know?',
    guide: 'List terms a new employee would need defined: acronyms (NAV, ACH, AUM), software names (Syndication Pro, QuickBooks), role titles (Fund Controller, IR Associate), industry terms (capital call, waterfall), and any internal shorthand.\n\nExample:\nNAV - Net Asset Value, calculated monthly by Fund Administration\nACH - Automated Clearing House, electronic payment method\nJuniper Square - investor portal for statements and payments',
  },
  {
    id: 'overview',
    heading: '3. Overview',
    question: 'Describe the process from start to finish, what triggers it, and what systems are involved.',
    guide: 'Summarize the full process so someone can understand the big picture. Include what event starts it and which systems are used.\n\nExample:\nThis process runs on the first business day of each month. The Fund Controller pulls the NAV report from QuickBooks, calculates distributions in Excel, uploads the payment file to Juniper Square, and sends notices to all LPs.\n\nTriggered by: First business day of each month\nSystems: QuickBooks (NAV data), Excel (calculations), Juniper Square (payments)',
  },
  {
    id: 'procedure',
    heading: '4. Procedure',
    question: 'Walk through each step of the process in order. Who does what?',
    guide: 'List every step in order. Be specific enough that a new person could follow without help. Mark each step as Maker (person executing) or Checker (person verifying).\n\nExample:\nStep 1: Log into QuickBooks and export the monthly NAV report (Maker)\nStep 2: Open the distribution calculator and paste in NAV figures (Maker)\nStep 3: Verify total distribution matches the NAV report (Checker)\nStep 4: Upload payment file to Juniper Square (Maker)\nStep 5: Review all amounts before releasing (Checker)',
  },
  {
    id: 'risks-and-controls',
    heading: '5. Risks and Controls',
    question: 'What could go wrong in this process, and what prevents it?',
    guide: 'Think worst-case: wrong numbers, missed deadlines, unauthorized access, data sent to the wrong person. For each risk, describe the safeguard.\n\nExample:\nRisk: Incorrect distribution amount sent to an investor\nControl: Checker independently verifies all amounts against the NAV report before payment\n\nRisk: Payment sent to wrong bank account\nControl: Bank details locked in Juniper Square, require dual approval to change',
  },
  {
    id: 'escalation-path',
    heading: '6. Escalation Path',
    question: 'Who gets contacted when something goes wrong, and how quickly?',
    guide: 'Include names or roles and specific timeframes.\n\nExample:\nDiscrepancy over $500: Notify Fund Controller within one business day\nUnresolved after 48 hours: Escalate to Managing Partner immediately\nSystem outage: Contact IT and notify investors within 4 hours',
  },
  {
    id: 'compliance-references',
    heading: '7. Compliance References',
    question: 'Are there any regulations, policies, or legal requirements tied to this process?',
    guide: 'List any rules or agreements this SOP relates to. If none apply, write "No specific regulatory requirements. This SOP follows internal best practices."\n\nExample:\nFund LPA Section 8.3 - Distribution provisions and payment timing\nSEC Rule 206(4)-7 - Compliance program requirements',
  },
  {
    id: 'completion-checklist',
    heading: '8. Completion Checklist',
    question: 'What needs to be verified before this process is considered done?',
    guide: 'List simple yes/no items, each assigned to Maker or Checker.\n\nExample:\nAll distribution amounts match NAV report (Checker)\nPayment file uploaded to Juniper Square (Maker)\nAll LP notices sent (Maker)\nBank confirmations received (Checker)',
  },
  {
    id: 'key-contacts',
    heading: '9. Key Contacts',
    question: 'Who is involved in this process?',
    guide: 'List the Maker, Checker, and any external parties with contact info and role.\n\nExample:\nMaker: J Jones, j@vegarei.com - Prepares and executes distributions\nChecker: Margaret McCann, m@vegarei.com - Reviews and approves payments\nExternal: First National Bank, wire desk 555-0100 - Processes outgoing wires',
  },
  {
    id: 'approval',
    heading: '10. Approval',
    question: 'Who needs to sign off on this SOP?',
    guide: 'List who prepared it, who reviewed it, and who approved it.\n\nExample:\nPrepared by: J Jones (March 31, 2026)\nReviewed by: Margaret McCann\nApproved by: Managing Partner',
  },
  {
    id: 'review-schedule',
    heading: '11. Review Schedule',
    question: 'How often should this SOP be reviewed?',
    guide: 'Standard is quarterly (March 31, June 30, September 30, December 31) plus any material change. Adjust if needed.\n\nExample:\nQuarterly review at the end of each calendar quarter, and immediately if the process, systems, or personnel change.',
  },
]

// ── Generate copy-paste prompt for AI ────────────────────────

function buildPromptForSection(step, sopTitle) {
  return `I am writing a Standard Operating Procedure (SOP) titled "${sopTitle || 'Untitled'}".

I need help writing the "${step.heading}" section.

Here is what this section should cover:
${step.guide}

Writing rules:
- Direct, imperative, present tense ("Navigate to..." not "The user should navigate to...")
- Professional but readable tone
- Do not use em dashes. Use regular dashes or rewrite.
- Be specific and thorough
- Keep sentences concise

Please rewrite my notes below into clean, professional SOP content for this section:

[PASTE YOUR NOTES HERE]`
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
    const sectionId = sectionIdFromHeading(headingText)

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

    if (sectionId === 'revision-history') {
      revisionHtml = contentHtml
    } else if (sectionId && !isPlaceholderContent(contentText) && contentText.length > 0) {
      sectionContent[sectionId] = contentHtml
    }
  }

  return { preamble, sectionContent, revisionHtml }
}

function reassembleHtml(preamble, sectionContent, revisionHtml) {
  let body = ''
  for (const step of WIZARD_STEPS) {
    if (sectionContent[step.id]) {
      body += `<h2>${step.heading}</h2>\n${sectionContent[step.id]}\n\n`
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
  const [dirty, setDirty] = useState(false)
  const isGoogleDoc = useRef(false)

  const [preamble, setPreamble] = useState('')
  const [sectionContent, setSectionContent] = useState({})
  const [revisionHtml, setRevisionHtml] = useState('')

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [showGuide, setShowGuide] = useState(true)

  const step = WIZARD_STEPS[currentStep]
  const totalSteps = WIZARD_STEPS.length

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
        const parsed = parseExistingContent(reconstructed)
        setPreamble(parsed.preamble)
        setSectionContent(parsed.sectionContent)
        setRevisionHtml(parsed.revisionHtml)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId, accessToken])

  // When navigating to a step, load existing content
  useEffect(() => {
    if (!step) return
    const existing = sectionContent[step.id]
    if (existing) {
      const tmp = document.createElement('div')
      tmp.innerHTML = existing
      setUserInput(tmp.textContent.trim())
      setShowGuide(false)
    } else {
      setUserInput('')
      setShowGuide(true)
    }
    setCopied(false)
  }, [currentStep])

  const handleCopyPrompt = useCallback(() => {
    const prompt = buildPromptForSection(step, title)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [step, title])

  const handleSaveSection = useCallback(() => {
    if (userInput.trim()) {
      const html = userInput.trim().split(/\n{2,}/).map(p =>
        `<p>${p.trim().replace(/\n/g, '<br>')}</p>`
      ).join('\n')
      setSectionContent(prev => ({ ...prev, [step.id]: html }))
      setDirty(true)
    }
  }, [userInput, step])

  const handleNext = useCallback(() => {
    handleSaveSection()
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps, handleSaveSection])

  const handleSkip = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps])

  const handleBack = useCallback(() => {
    handleSaveSection()
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep, handleSaveSection])

  const handleSave = useCallback(async () => {
    handleSaveSection()
    setSaving(true)
    setError(null)
    try {
      const fullHtml = reassembleHtml(preamble, sectionContent, revisionHtml)
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
  }, [docId, accessToken, preamble, sectionContent, revisionHtml, handleSaveSection])

  const handleCancel = useCallback(() => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }, [dirty, onClose])

  const filledCount = Object.keys(sectionContent).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center px-6 py-3 border-b border-gray-200 bg-gray-50">
        <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D] mr-4">
          {title || 'Edit SOP'}
        </span>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mr-4">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { handleSaveSection(); setCurrentStep(i) }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentStep
                  ? 'bg-[#27474D] scale-125'
                  : sectionContent[s.id]
                    ? 'bg-[#22c55e]'
                    : 'bg-gray-300'
              }`}
              title={s.heading}
            />
          ))}
        </div>

        <span className="text-[10px] font-mono text-gray-400">
          {currentStep + 1} of {totalSteps} &middot; {filledCount} filled
        </span>

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
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save & Close'}
        </button>
      </div>

      {/* Wizard content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-3" />
            <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading...</span>
          </div>
        ) : step ? (
          <div className="max-w-2xl mx-auto px-8 py-12">
            {/* Section heading */}
            <div style={mono} className="text-[10px] uppercase tracking-wider text-[#797469] mb-2">
              Section {currentStep + 1} of {totalSteps}
            </div>
            <h2 className="text-xl font-bold text-[#111] mb-2">{step.heading}</h2>
            <p className="text-base text-[#111] font-medium mb-5">{step.question}</p>

            {/* Collapsible guide with example */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-mono text-[#6366f1] hover:underline mb-3 flex items-center gap-1"
            >
              {showGuide ? 'Hide guidance' : 'Show guidance and example'}
            </button>

            {showGuide && (
              <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-5">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{step.guide}</pre>
              </div>
            )}

            {/* Text input */}
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Type or paste your content here..."
              className="w-full border border-gray-300 rounded px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#27474D] transition-colors resize-none"
              rows={10}
            />

            {/* Actions row */}
            <div className="flex items-center gap-3 mt-4">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
                >
                  Back
                </button>
              )}

              {/* Copy prompt helper */}
              <button
                onClick={handleCopyPrompt}
                className="text-xs font-mono text-[#6366f1] hover:underline px-2 py-2"
              >
                {copied ? 'Copied!' : 'Copy AI prompt'}
              </button>

              <div className="flex-1" />

              <button
                onClick={handleSkip}
                className="text-xs font-mono px-4 py-2 text-gray-400 hover:text-black transition-colors"
              >
                Skip
              </button>

              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="text-xs font-mono px-5 py-2 bg-black text-white hover:bg-[#27474D] transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs font-mono px-5 py-2 bg-[#22c55e] text-white hover:bg-[#16a34a] transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save & Close'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
