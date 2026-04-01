// ── Gemini AI Service ──────────────────────────────────────
// Uses Google Gemini API for grammar checking and AI-assisted SOP writing.
// Swappable to Claude or another provider by changing this one file.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured')

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Grammar and spelling check ───────────────────────────────
// Returns a cleaned-up version of the text with corrections applied,
// plus a list of changes made.

export async function checkGrammar(text) {
  const prompt = `You are a professional copy editor specializing in Standard Operating Procedures for institutional businesses. Review the following text and fix:

1. Spelling and grammar errors
2. Punctuation issues
3. Passive voice - rewrite in active, imperative present tense (e.g. "Navigate to..." not "The user should navigate to...")
4. Wordiness - tighten sentences, remove filler words
5. Inconsistent tone - ensure direct, professional, concise language throughout
6. Vague instructions - flag any steps that are unclear (e.g. "do the thing" should be specific)

Do NOT use em dashes anywhere. Use regular dashes or rewrite the sentence.
Do NOT add emojis or casual language.
Keep the tone formal but readable.

Return your response in this exact format:
CORRECTED:
[The full corrected text with all fixes applied]

CHANGES:
- [Description of each change made, one per line]

If the text has no issues, return:
CORRECTED:
[The original text unchanged]

CHANGES:
- No corrections needed.

Here is the text to review:

${text}`

  const response = await callGemini(prompt)

  const correctedMatch = response.match(/CORRECTED:\n([\s\S]*?)(?=\nCHANGES:)/i)
  const changesMatch = response.match(/CHANGES:\n([\s\S]*)/i)

  return {
    corrected: correctedMatch ? correctedMatch[1].trim() : text,
    changes: changesMatch
      ? changesMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim().replace(/^-\s*/, ''))
      : [],
  }
}

// ── AI-assisted SOP writing ──────────────────────────────────
// Takes a plain description of a process and generates structured
// SOP content matching the Vega template format.

export async function generateSopContent({ description, sopTitle, category }) {
  const prompt = `You are writing a Standard Operating Procedure (SOP) for a professional organization. The writing style should be direct, clear, and in the imperative present tense. Write as if giving instructions to someone performing the task for the first time.

Good example: "Navigate to Business ACH and click New Template."
Bad example: "The user should navigate to Business ACH..."

Based on the following description of a business process, generate the SOP content sections below. Be thorough but concise. Use real-world detail where the description provides it, and use clear placeholder language where it does not.

SOP Title: ${sopTitle || 'Untitled'}
Category: ${category || 'General'}

Process Description:
${description}

Generate the following sections. Return each section with its heading exactly as shown:

PURPOSE:
[One to two sentences explaining why this SOP exists]

SCOPE:
[What this process covers and what it does not]

DEFINITIONS:
[List relevant terms, acronyms, systems, and roles as "Term: Definition" pairs, one per line. Include any software, acronyms, or jargon mentioned in the description.]

OVERVIEW:
[Brief summary of the end-to-end process]

TRIGGER:
[What event starts this process]

KEY_SYSTEMS:
[List as "System | Used For | Access" rows, one per line]

STEPS:
[Numbered list of steps. Each step on its own line in this format:
01. [Action] | [Detail] | [Maker or Checker]
Group related steps under phase headers like:
PHASE 1: [Phase Name]
01. [Action] | [Detail] | [Maker or Checker]]

RISKS:
[List as "Risk | What Could Go Wrong | Control" rows, one per line]

ESCALATION:
[List as "Situation | Escalate To | Timeframe" rows, one per line]

CHECKLIST:
[List items to verify before closing, one per line, with "Maker" or "Checker" after each]

Do not include any markdown formatting. Do not use em dashes. Use plain dashes where needed.`

  const response = await callGemini(prompt)
  return parseSopResponse(response)
}

function parseSopResponse(response) {
  const sections = {}
  const sectionNames = ['PURPOSE', 'SCOPE', 'DEFINITIONS', 'OVERVIEW', 'TRIGGER', 'KEY_SYSTEMS', 'STEPS', 'RISKS', 'ESCALATION', 'CHECKLIST']

  for (let i = 0; i < sectionNames.length; i++) {
    const name = sectionNames[i]
    const nextName = sectionNames[i + 1]
    const pattern = nextName
      ? new RegExp(`${name}:\\n([\\s\\S]*?)(?=\\n${nextName}:)`, 'i')
      : new RegExp(`${name}:\\n([\\s\\S]*)`, 'i')
    const match = response.match(pattern)
    sections[name.toLowerCase()] = match ? match[1].trim() : ''
  }

  return sections
}

// ── Generate a draft for a single SOP section ───────────────
// Used by the section-based editor's "AI Draft" button.

export async function generateSectionDraft(sectionId, guidanceText, sopTitle) {
  const prompt = `You are writing one section of a Standard Operating Procedure (SOP) for "${sopTitle || 'a business process'}".

Writing rules:
- Direct, imperative, present tense: "Navigate to..." not "The user should navigate to..."
- Professional but readable
- No em dashes anywhere, use regular dashes or rewrite
- No emojis or casual language
- Be specific and thorough

Based on the guidance below, generate a realistic draft for this section. Use placeholder names and systems where specific details are not available, but make them realistic (e.g. "Juniper Square" not "System X").

Return ONLY the HTML content for this section. Do not include the section heading (h2). Use appropriate HTML tags: <p> for paragraphs, <table> for tables, <ul>/<li> for lists, <strong> for bold. For tables, use <thead><tr><th> for headers and <tbody><tr><td> for data rows.

Section guidance:
${guidanceText}

Generate the section content now:`

  const response = await callGemini(prompt)

  // Clean up any markdown artifacts
  let html = response
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()

  return html
}

// ── Rewrite user input for a specific SOP section ────────────
// Takes rough notes from the user and rewrites them in proper
// SOP format, tone, and structure for the given section.

export async function rewriteForSection(sectionId, userInput, sopTitle) {
  const sectionContext = {
    'purpose-and-scope': 'Purpose and Scope section. Write a clear Purpose statement (1-2 sentences on why this SOP exists) and a Scope statement (what is covered and what is not). Use <div class="sub-label">1.1 Purpose</div> and <div class="sub-label">1.2 Scope</div> as sub-headings.',
    'definitions': 'Definitions section. Format as an HTML table with <th>Term</th><th>Definition</th> headers. Each term gets one row. Keep definitions to one clear sentence each.',
    'overview': 'Overview section. Write a brief summary paragraph, then a Trigger sub-section (<div class="sub-label">3.1 Trigger</div>) explaining what kicks off the process, then a Key Systems sub-section (<div class="sub-label">3.2 Key Systems</div>) as a table with System, Used For, and Access columns.',
    'procedure': 'Procedure section. Format steps in a table with Step, Action, and Role columns. Use <span class="step-num">01</span> for step numbers, <span class="step-action">...</span> for the action, <span class="step-detail">...</span> for details, and <span class="maker">Maker</span> or <span class="checker">Checker</span> for roles. Group steps under phase headers using <div class="phase"><span class="phase-num">PHASE 1</span><span class="phase-title">Title</span></div> if there are distinct stages.',
    'risks-and-controls': 'Risks and Controls section. Format as a table with Risk, What Could Go Wrong, and Control columns. Be specific about both the risk and the control that addresses it.',
    'escalation-path': 'Escalation Path section. Format as a table with Situation, Escalate To, and Timeframe columns. Include specific names/roles and time expectations.',
    'compliance-references': 'Compliance References section. Format as a table with Reference and Description columns. If the user mentions no specific regulations, write "No specific regulatory requirements. This SOP follows internal best practices."',
    'completion-checklist': 'Completion Checklist section. Format as a table with Item and Verified By columns. Each item should be a simple yes/no verification. Assign each to Maker or Checker.',
    'key-contacts': 'Key Contacts section. Format as a table with Party, Contact, and Role in this Process columns.',
    'approval': 'Approval section. Format as a table with Role, Name, and Date columns. Include rows for Prepared By (Maker), Reviewed By (Checker), and Approved By.',
    'review-schedule': 'Review Schedule section. Write one paragraph about the review cadence. Standard is quarterly (March 31, June 30, September 30, December 31) plus any material changes.',
    'revision-history': 'Revision History section. Format as a table with class="rev-table" and columns Version, Date, Author, Changes.',
  }

  const context = sectionContext[sectionId] || 'a section of an SOP'

  const prompt = `You are formatting content for the ${context}

SOP Title: "${sopTitle || 'Untitled'}"

The user has written the following rough notes. Rewrite them into clean, professional SOP content:
- Direct, imperative, present tense ("Navigate to..." not "The user should navigate to...")
- No em dashes, use regular dashes or rewrite the sentence
- No emojis or casual language
- Professional but readable
- Be thorough but concise
- Keep all the information the user provided, just clean up the writing and format

Return ONLY the HTML content. Do not include any section heading (h2). Use appropriate HTML tags: <p> for paragraphs, <table> for tables (with <thead> and <tbody>), <ul>/<li> for lists, <strong> for bold, <div class="sub-label"> for sub-headings.

User's notes:
${userInput}`

  const response = await callGemini(prompt)

  return response
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()
}

// ── Check if Gemini is available ─────────────────────────────
export function isGeminiAvailable() {
  return !!GEMINI_API_KEY
}
