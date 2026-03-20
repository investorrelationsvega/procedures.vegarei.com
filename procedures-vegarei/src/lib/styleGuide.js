// ── Style Guide Configuration ─────────────────────────────
// Persisted to localStorage. Will be passed to AI assistant when wired up.

const STORAGE_KEY = 'vega-sop-style-guide'

export const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', desc: 'Conversational, approachable tone' },
  { value: 'professional', label: 'Professional', desc: 'Clear, business-appropriate language' },
  { value: 'formal', label: 'Formal / Legal', desc: 'Precise, regulatory-grade language' },
]

export const VOICE_OPTIONS = [
  { value: 'first-person', label: 'First Person', example: '"We verify all documents…"' },
  { value: 'third-person', label: 'Third Person', example: '"The Manager shall verify…"' },
  { value: 'imperative', label: 'Imperative', example: '"Verify all documents…"' },
]

export const DETAIL_OPTIONS = [
  { value: 'high-level', label: 'High-Level', desc: 'Overview with key steps only' },
  { value: 'standard', label: 'Standard', desc: 'Balanced detail for most procedures' },
  { value: 'granular', label: 'Granular', desc: 'Step-by-step with sub-steps and notes' },
]

export const DEFAULT_STYLE_GUIDE = {
  formality: 'professional',
  voice: 'third-person',
  detailLevel: 'standard',
  useJargon: true,
  glossary: [],
  customInstructions: '',
  templateSections: [
    { key: 'purpose', label: 'Purpose', enabled: true },
    { key: 'scope', label: 'Scope', enabled: true },
    { key: 'responsibilities', label: 'Responsibilities', enabled: true },
    { key: 'procedure', label: 'Procedure', enabled: true },
    { key: 'references', label: 'References', enabled: true },
  ],
}

export function loadStyleGuide() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_STYLE_GUIDE, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load style guide:', e)
  }
  return { ...DEFAULT_STYLE_GUIDE }
}

export function saveStyleGuide(guide) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guide))
  } catch (e) {
    console.error('Failed to save style guide:', e)
  }
}

// Build a system prompt string from the style guide (for AI integration later)
export function buildStylePrompt(guide) {
  const formality = FORMALITY_OPTIONS.find(f => f.value === guide.formality)
  const voice = VOICE_OPTIONS.find(v => v.value === guide.voice)
  const detail = DETAIL_OPTIONS.find(d => d.value === guide.detailLevel)

  let prompt = `Write SOPs with these style guidelines:\n`
  prompt += `- Tone: ${formality?.label} — ${formality?.desc}\n`
  prompt += `- Voice: ${voice?.label} — ${voice?.example}\n`
  prompt += `- Detail Level: ${detail?.label} — ${detail?.desc}\n`
  prompt += `- Industry jargon: ${guide.useJargon ? 'Use domain-specific terminology' : 'Use plain language, avoid jargon'}\n`

  if (guide.glossary.length > 0) {
    prompt += `- Preferred terminology:\n`
    guide.glossary.forEach(g => {
      prompt += `  - Use "${g.preferred}" instead of "${g.avoid}"\n`
    })
  }

  const enabledSections = guide.templateSections.filter(s => s.enabled)
  if (enabledSections.length > 0) {
    prompt += `- Required sections: ${enabledSections.map(s => s.label).join(', ')}\n`
  }

  if (guide.customInstructions.trim()) {
    prompt += `\nAdditional instructions:\n${guide.customInstructions}\n`
  }

  return prompt
}
