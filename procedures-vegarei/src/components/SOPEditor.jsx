import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'
import { reconstructTemplate } from '../lib/sopTemplate'
import { checkGrammar, isGeminiAvailable, rewriteForSection } from '../services/geminiService'

const mono = { fontFamily: "'Space Mono', monospace" }

// ── Section wizard steps ────────────────────────────────────
// Each step maps to a template section with a question, explanation, and example.

const WIZARD_STEPS = [
  {
    id: 'purpose-and-scope',
    heading: '1. Purpose and Scope',
    question: 'What is the purpose of this SOP, and what does it cover?',
    explanation: 'The purpose states why this SOP exists in one to two sentences. The scope defines what this process covers and what it does not. Be specific about boundaries so there is no confusion.',
    example: 'Purpose: "This SOP ensures consistent and accurate processing of monthly investor distributions for all Vega Assisted Living Fund II, L.P. limited partners."\n\nScope: "Covers all Class A and Class B limited partner distributions processed through Juniper Square. Does not cover GP distributions, special allocations, or one-time redemption payments."',
  },
  {
    id: 'definitions',
    heading: '2. Definitions',
    question: 'What terms, acronyms, or systems would someone need to know?',
    explanation: 'Think about a new employee on their first day. What would they need defined? Include acronyms (NAV, ACH, AUM), software names (Syndication Pro, QuickBooks), role titles (Fund Controller, IR Associate), industry terms (capital call, waterfall), and any internal shorthand.',
    example: 'NAV - Net Asset Value, calculated monthly by Fund Administration\nACH - Automated Clearing House, the electronic payment method used for distributions\nJuniper Square - investor portal used to send statements and process payments\nFund Controller - person responsible for fund accounting and financial reporting',
  },
  {
    id: 'overview',
    heading: '3. Overview',
    question: 'Describe the process from start to finish, what triggers it, and what systems are involved.',
    explanation: 'Write a brief summary someone could read to understand the full picture. Then specify what event kicks off this process and list each system used.',
    example: 'This process runs on the first business day of each month. The Fund Controller pulls the NAV report from QuickBooks, calculates each investor distribution in Excel, uploads the payment file to Juniper Square, and sends distribution notices to all LPs.\n\nTriggered by: First business day of each month\nSystems: QuickBooks (NAV data), Excel (calculations), Juniper Square (payments and notices)',
  },
  {
    id: 'procedure',
    heading: '4. Procedure',
    question: 'Walk through each step of the process in order. Who does what?',
    explanation: 'List every step someone would need to follow. Be specific enough that a new person could do this without asking for help. For each step, note whether it is done by the Maker (person executing) or Checker (person verifying).',
    example: 'Step 1: Log into QuickBooks and export the monthly NAV report (Maker)\nStep 2: Open the distribution calculator spreadsheet and paste in the NAV figures (Maker)\nStep 3: Verify the total distribution amount matches the NAV report (Checker)\nStep 4: Upload the payment file to Juniper Square (Maker)\nStep 5: Review all payment amounts in Juniper Square before releasing (Checker)\nStep 6: Send distribution notices to all LPs through Juniper Square (Maker)',
  },
  {
    id: 'risks-and-controls',
    heading: '5. Risks and Controls',
    question: 'What could go wrong in this process, and what prevents it?',
    explanation: 'Think worst-case: wrong numbers, missed deadlines, unauthorized access, data sent to the wrong person. For each risk, describe the specific safeguard that catches or prevents it.',
    example: 'Risk: Incorrect distribution amount sent to an investor\nControl: Checker independently verifies all amounts against the NAV report before any payment is released\n\nRisk: Payment sent to wrong bank account\nControl: Bank details are locked in Juniper Square and require dual approval to change',
  },
  {
    id: 'escalation-path',
    heading: '6. Escalation Path',
    question: 'Who gets contacted when something goes wrong, and how quickly?',
    explanation: 'Include names or roles and specific timeframes. Remove ambiguity about what to do when a problem comes up.',
    example: 'Distribution discrepancy over $500: Notify Fund Controller within one business day\nIssue unresolved after 48 hours: Escalate to Managing Partner immediately\nSystem outage preventing payment: Contact IT and notify investors of delay within 4 hours',
  },
  {
    id: 'compliance-references',
    heading: '7. Compliance References',
    question: 'Are there any regulations, policies, or legal requirements tied to this process?',
    explanation: 'List any rules or agreements this SOP relates to. If none, that is fine. Just note that the SOP follows internal best practices.',
    example: 'Fund LPA Section 8.3 - Distribution provisions and payment timing\nSEC Rule 206(4)-7 - Compliance program requirements\nVega Internal Policy 4.2 - Investor communications standards',
  },
  {
    id: 'completion-checklist',
    heading: '8. Completion Checklist',
    question: 'What needs to be verified before this process is considered done?',
    explanation: 'List simple yes/no items. Each should be assigned to either the Maker or Checker.',
    example: 'All distribution amounts match NAV report (Checker)\nPayment file uploaded to Juniper Square (Maker)\nAll LP notices sent (Maker)\nBank confirmations received for all payments (Checker)',
  },
  {
    id: 'key-contacts',
    heading: '9. Key Contacts',
    question: 'Who is involved in this process?',
    explanation: 'List the Maker, Checker, and any external parties with their contact info and role.',
    example: 'Maker: J Jones, j@vegarei.com - Prepares and executes distributions\nChecker: Margaret McCann, m@vegarei.com - Reviews and approves all payments\nExternal: First National Bank, wire desk 555-0100 - Processes outgoing wires',
  },
  {
    id: 'approval',
    heading: '10. Approval',
    question: 'Who needs to sign off on this SOP?',
    explanation: 'List who prepared it, who reviewed it, and who gave final approval. Include dates.',
    example: 'Prepared by: J Jones (March 31, 2026)\nReviewed by: Margaret McCann\nApproved by: Managing Partner',
  },
  {
    id: 'review-schedule',
    heading: '11. Review Schedule',
    question: 'How often should this SOP be reviewed?',
    explanation: 'Standard is quarterly (March 31, June 30, September 30, December 31) plus whenever there is a material change. You can adjust if needed.',
    example: 'Quarterly review at the end of each calendar quarter, and immediately if the distribution process, systems, or personnel change.',
  },
]

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
    } else if (sectionId && !isPlaceholderContent(contentText)) {
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
  // Always include revision history
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
  const [polishing, setPolishing] = useState(false)
  const [polishedHtml, setPolishedHtml] = useState(null)
  const [mode, setMode] = useState('input') // 'input' | 'review'

  // Grammar check state
  const [checking, setChecking] = useState(false)
  const [grammarChanges, setGrammarChanges] = useState(null)

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

        // If first section already has content, pre-fill the text area
        const firstStep = WIZARD_STEPS[0]
        if (parsed.sectionContent[firstStep.id]) {
          const tmp = document.createElement('div')
          tmp.innerHTML = parsed.sectionContent[firstStep.id]
          setUserInput(tmp.textContent.trim())
          setMode('review')
          setPolishedHtml(parsed.sectionContent[firstStep.id])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId, accessToken])

  // When navigating to a step, load existing content if any
  useEffect(() => {
    if (!step) return
    const existing = sectionContent[step.id]
    if (existing) {
      const tmp = document.createElement('div')
      tmp.innerHTML = existing
      setUserInput(tmp.textContent.trim())
      setMode('review')
      setPolishedHtml(existing)
    } else {
      setUserInput('')
      setMode('input')
      setPolishedHtml(null)
    }
    setGrammarChanges(null)
  }, [currentStep])

  const handlePolish = useCallback(async () => {
    if (!userInput.trim()) return
    setPolishing(true)
    setError(null)
    try {
      const result = await rewriteForSection(step.id, userInput, title)
      setPolishedHtml(result)
      setMode('review')
      // Save the polished content
      setSectionContent(prev => ({ ...prev, [step.id]: result }))
      setDirty(true)
    } catch (err) {
      setError('Failed to polish: ' + err.message)
    } finally {
      setPolishing(false)
    }
  }, [userInput, step, title])

  const handleSkip = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps])

  const handleNext = useCallback(() => {
    // If in input mode with text, polish first
    if (mode === 'input' && userInput.trim()) {
      handlePolish()
      return
    }
    // Move to next step
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [mode, userInput, currentStep, totalSteps, handlePolish])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleEditPolished = useCallback(() => {
    setMode('input')
    setPolishedHtml(null)
  }, [])

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
      setDirty(false)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [docId, accessToken, preamble, sectionContent, revisionHtml])

  const handleCancel = useCallback(() => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }, [dirty, onClose])

  const handleGrammarCheck = useCallback(async () => {
    if (!polishedHtml) return
    setChecking(true)
    setError(null)
    setGrammarChanges(null)
    try {
      const tmp = document.createElement('div')
      tmp.innerHTML = polishedHtml
      const result = await checkGrammar(tmp.textContent)
      setGrammarChanges(result.changes)
    } catch (err) {
      setError('Grammar check failed: ' + err.message)
    } finally {
      setChecking(false)
    }
  }, [polishedHtml])

  // Count filled sections
  const filledCount = Object.keys(sectionContent).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center px-6 py-3 border-b border-gray-200 bg-gray-50">
        <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D] mr-4">
          {title || 'Edit SOP'}
        </span>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mr-4">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
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

            {/* Question */}
            <p className="text-base text-[#111] font-medium mb-4">{step.question}</p>

            {/* Explanation */}
            <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-4">
              <p className="text-sm text-gray-600 leading-relaxed">{step.explanation}</p>
            </div>

            {/* Example */}
            <div className="bg-[#f0f5f5] border border-[#27474D]/10 rounded px-4 py-3 mb-6">
              <div style={mono} className="text-[9px] uppercase tracking-wider text-[#27474D] font-bold mb-1.5">Example</div>
              <pre className="text-xs text-[#27474D] whitespace-pre-wrap font-sans leading-relaxed">{step.example}</pre>
            </div>

            {/* Input or Review mode */}
            {mode === 'input' ? (
              <>
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Type your answer here... Be as rough as you want. Gemini will clean it up."
                  className="w-full border border-gray-300 rounded px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#27474D] transition-colors resize-none"
                  rows={8}
                />

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
                    >
                      Back
                    </button>
                  )}

                  <div className="flex-1" />

                  <button
                    onClick={handleSkip}
                    className="text-xs font-mono px-4 py-2 text-gray-400 hover:text-black transition-colors"
                  >
                    Skip
                  </button>

                  {isGeminiAvailable() && userInput.trim() ? (
                    <button
                      onClick={handlePolish}
                      disabled={polishing}
                      className="text-xs font-mono px-5 py-2 bg-[#6366f1] text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-40 flex items-center gap-2"
                    >
                      {polishing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Polishing...
                        </>
                      ) : (
                        'Next'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!userInput.trim() && !sectionContent[step.id]}
                      className="text-xs font-mono px-5 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Polished preview */}
                <div className="border border-gray-200 rounded mb-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <span style={mono} className="text-[10px] uppercase tracking-wider text-[#22c55e] font-bold">
                      Polished by Gemini
                    </span>
                    <div className="flex items-center gap-2">
                      {isGeminiAvailable() && (
                        <button
                          onClick={handleGrammarCheck}
                          disabled={checking}
                          className="text-[10px] font-mono text-[#6366f1] hover:underline"
                        >
                          {checking ? 'Checking...' : 'Check grammar'}
                        </button>
                      )}
                      <button
                        onClick={handleEditPolished}
                        className="text-[10px] font-mono text-gray-500 hover:text-black"
                      >
                        Edit input
                      </button>
                    </div>
                  </div>
                  <div
                    className="sop-document px-4 py-3"
                    dangerouslySetInnerHTML={{ __html: polishedHtml }}
                  />
                </div>

                {/* Grammar suggestions */}
                {grammarChanges && grammarChanges.length > 0 && grammarChanges[0] !== 'No corrections needed.' && (
                  <div className="bg-[#6366f1]/5 border border-[#6366f1]/20 rounded px-4 py-3 mb-4">
                    <div style={mono} className="text-[10px] uppercase tracking-wider text-[#6366f1] font-bold mb-2">
                      Suggestions
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {grammarChanges.map((change, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#6366f1]">-</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
                    >
                      Back
                    </button>
                  )}

                  <div className="flex-1" />

                  {currentStep < totalSteps - 1 ? (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="text-xs font-mono px-5 py-2 bg-black text-white hover:bg-[#27474D] transition-colors"
                    >
                      Next Section
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
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
