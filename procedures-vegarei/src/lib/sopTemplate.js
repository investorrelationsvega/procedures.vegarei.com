// ── Vega SOP Template ──────────────────────────────────────
// Based on sop-template.html — the canonical template for all Vega SOPs.

const VEGA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1602.14 586.87" height="24" style="display:block;"><polygon points="474.94 371.81 694.38 371.81 694.38 320.83 474.94 320.83 474.94 184.06 727.34 184.06 727.34 133.09 416.51 133.09 416.51 575.71 733.55 575.71 733.55 524.74 474.94 524.74 474.94 371.81"/><path d="M1441.79,133.12h-62.16l-169.15,442.55h62.82l51.03-135.47,18-51.03,67.08-183.39h1.3l63.46,183.39,18,51.03,47.27,135.47h62.69l-160.34-442.55Z"/><path d="M0,133.09h64.04l115.63,361.8h1.24l123.09-361.8h61.54l-157.28,442.62h-60.3L0,133.09Z"/><path d="M182.77,0c-8.8,61.66-27.56,110.27-51.34,133.09,23.79,22.82,42.54,71.43,51.34,133.09,8.8-61.66,27.56-110.27,51.34-133.09-23.79-22.82-42.54-71.43-51.34-133.09Z"/><path d="M965.68,381.82h137.75v129.49c-10.38,6.49-21.85,11.63-34.51,15.59-19.29,6.09-40.54,9.07-63.72,9.07-27.33,0-51.03-5.05-71.23-15.28-20.07-10.1-36.65-23.7-49.73-40.67-12.95-16.97-22.66-36.78-28.88-59.06-6.22-22.41-9.33-45.85-9.33-70.33s3.63-46.11,10.88-67.74c7.25-21.5,17.74-40.41,31.47-56.6,13.6-16.19,30.3-29.01,49.99-38.85,19.69-9.71,41.96-14.63,66.82-14.63,21.12,0,39.89,2.46,56.21,7.25,16.45,4.79,30.56,11.27,42.61,19.56,8.28,5.7,16.7,12.56,23.96,20.08l33.41-43.52c-9.45-8.81-21.11-16.84-29.14-21.76-18-11.01-37.68-18.52-59.31-24.09-21.5-5.7-44.17-8.42-67.74-8.42-35.62,0-67.22,6.73-94.8,20.2-27.58,13.47-50.9,31.21-69.94,53.1-19.04,22.02-33.42,46.88-43.13,74.6-9.84,27.84-14.63,55.95-14.63,84.57,0,34.45,5.05,65.92,15.15,94.54,10.23,28.49,24.87,53.1,44.17,73.56,19.29,20.59,42.74,36.39,70.2,47.66,27.58,11.14,58.54,16.71,92.99,16.71,31.09,0,65.15-2.59,92.73-12.95,2.48-.88,5.08-1.96,7.76-3.17h0c.16-.07.32-.14.48-.22.19-.09.38-.17.58-.26,16.42-7.43,35.61-19.49,51.54-35.86v-207.45h-192.61v54.86Z"/></svg>`

/**
 * Generate a blank SOP HTML from the canonical template.
 */
export function generateSopHtml({ sopId, title, scope, category, owner, author, checker, reviewCadence, date }) {
  const today = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return `<header class="doc-header">
  ${VEGA_LOGO_SVG}
  <div class="header-label">procedures.vegarei.com</div>
</header>

<div class="title-block">
  <div class="sop-id">${sopId || 'SOP-001'}</div>
  <div class="sop-title">${title || 'Untitled Procedure'}</div>
  <div class="sop-scope">${scope || 'One sentence describing what this SOP covers and who it applies to.'}</div>
</div>

<div class="meta-block">
  <p><strong>Version:</strong> 1.0</p>
  <p><strong>Effective:</strong> ${today}</p>
  <p><strong>Category:</strong> ${category || 'General'}</p>
  <p><strong>Owner:</strong> ${owner || 'TBD'}</p>
  <p><strong>Maker:</strong> ${author || 'TBD'}</p>
  <p><strong>Checker:</strong> ${checker || 'TBD'}</p>
  <p><strong>Review Cycle:</strong> ${reviewCadence || 'Quarterly'}</p>
  <p><strong>Classification:</strong> Internal / Confidential</p>
</div>

<div class="doc-body">

<h2>1. Purpose and Scope</h2>
<div class="sub-label">1.1 Purpose</div>
<p>State why this SOP exists in one to two sentences. What business need does it address? Example: "This SOP ensures consistent and accurate processing of monthly investor distributions for all Vega Assisted Living Fund II, L.P. limited partners."</p>

<div class="sub-label">1.2 Scope</div>
<p>Define what this SOP covers and, just as importantly, what it does not cover. Be specific about boundaries so there is no confusion about where this process starts and ends. Example: "Covers all Class A and Class B limited partner distributions processed through Juniper Square. Does not cover GP distributions, special allocations, or one-time redemption payments."</p>

<h2>2. Definitions</h2>
<p>List any terms that someone unfamiliar with this process would need to understand before reading further. Think about a new employee on their first day, or someone from a completely different department. The kinds of terms to include:</p>
<ul>
  <li><strong>Acronyms</strong> your team uses regularly (e.g. NAV, ACH, AUM, LP, GP, K-1)</li>
  <li><strong>Software and system names</strong> (e.g. Syndication Pro, Juniper Square, QuickBooks, AppFolio)</li>
  <li><strong>Role titles</strong> that may not be obvious (e.g. Fund Controller, IR Associate, Property Manager)</li>
  <li><strong>Industry or financial terms</strong> (e.g. capital call, waterfall, preferred return, carried interest)</li>
  <li><strong>Internal shorthand</strong> your team uses day to day that an outsider would not know</li>
</ul>
<table>
  <thead><tr><th>Term</th><th>Definition</th></tr></thead>
  <tbody>
    <tr><td></td><td></td></tr>
    <tr><td></td><td></td></tr>
  </tbody>
</table>

<h2>3. Overview</h2>
<p>Provide a brief summary of the end-to-end process in plain language. Someone should be able to read this section and understand the full picture before diving into the detailed steps below.</p>

<div class="sub-label">3.1 Trigger</div>
<p>What event kicks off this process? Be specific. Examples: "The first business day of each month," "When a new subscription agreement is received," "When an investor submits a redemption request."</p>

<div class="sub-label">3.2 Key Systems</div>
<table>
  <thead><tr><th>System</th><th>Used For</th><th>Access</th></tr></thead>
  <tbody>
    <tr><td></td><td></td><td></td></tr>
  </tbody>
</table>

<h2>4. Procedure</h2>
<p>Document each step of the process in the order it happens. Be specific enough that someone could follow these steps without asking for help. Use the Maker role for the person executing the step and the Checker role for the person verifying it.</p>

<div class="phase">
  <span class="phase-num">PHASE 1</span>
  <span class="phase-title">Phase Title</span>
  <span class="phase-note">Context or system</span>
</div>

<table>
  <thead><tr><th style="width:55px;">Step</th><th>Action</th><th style="width:80px;">Role</th></tr></thead>
  <tbody>
    <tr>
      <td><span class="step-num">01</span></td>
      <td>
        <span class="step-action">Describe the action in one clear sentence.</span>
        <span class="step-detail">Add any supporting detail: where to find something, what to watch for, format requirements, or what happens next. If no detail is needed, remove this line.</span>
      </td>
      <td><span class="maker">Maker</span></td>
    </tr>
    <tr>
      <td><span class="step-num">02</span></td>
      <td>
        <span class="step-action">Verify the previous step before proceeding.</span>
        <span class="step-detail">Describe what to check and what to do if something does not match.</span>
      </td>
      <td><span class="checker">Checker</span></td>
    </tr>
  </tbody>
</table>

<h2>5. Risks and Controls</h2>
<p>Identify what could go wrong during this process and what safeguards are in place to prevent or catch errors. Think about the worst-case scenarios: wrong numbers, missed deadlines, unauthorized access, data sent to the wrong person. For each risk, describe the specific control that addresses it.</p>

<table>
  <thead><tr><th>Risk</th><th>What Could Go Wrong</th><th>Control</th></tr></thead>
  <tbody>
    <tr>
      <td>Example</td>
      <td>Incorrect distribution amount sent to an investor</td>
      <td>Checker independently verifies all amounts against the NAV report before any payment is released</td>
    </tr>
    <tr><td></td><td></td><td></td></tr>
  </tbody>
</table>

<h2>6. Escalation Path</h2>
<p>Describe who to contact and what to do when something goes wrong or falls outside normal procedures. Include names, roles, and timeframes so there is no ambiguity about next steps when a problem occurs.</p>

<table>
  <thead><tr><th>Situation</th><th>Escalate To</th><th>Timeframe</th></tr></thead>
  <tbody>
    <tr>
      <td>Example: Distribution discrepancy exceeds $500</td>
      <td>Fund Controller</td>
      <td>Within one business day</td>
    </tr>
    <tr>
      <td>Example: Issue unresolved after 48 hours</td>
      <td>Managing Partner</td>
      <td>Immediately</td>
    </tr>
    <tr><td></td><td></td><td></td></tr>
  </tbody>
</table>

<h2>7. Compliance References</h2>
<p>List any regulations, internal policies, legal requirements, or governing documents that this SOP relates to. If this process exists because of a specific rule or agreement, reference it here. If none apply, write "No specific regulatory requirements. This SOP follows internal best practices."</p>

<table>
  <thead><tr><th>Reference</th><th>Description</th></tr></thead>
  <tbody>
    <tr>
      <td>Example: Fund LPA Section 8.3</td>
      <td>Distribution provisions and payment timing requirements</td>
    </tr>
    <tr><td></td><td></td></tr>
  </tbody>
</table>

<h2>8. Completion Checklist</h2>
<p>Before closing out this process, confirm every item below is complete. Do not skip any line.</p>

<table>
  <thead><tr><th>Item</th><th style="width:100px;">Verified By</th></tr></thead>
  <tbody>
    <tr><td></td><td>Maker</td></tr>
    <tr><td></td><td>Checker</td></tr>
  </tbody>
</table>

<h2>9. Key Contacts</h2>
<table>
  <thead><tr><th>Party</th><th>Contact</th><th>Role in this Process</th></tr></thead>
  <tbody>
    <tr><td>Maker</td><td></td><td></td></tr>
    <tr><td>Checker</td><td></td><td></td></tr>
  </tbody>
</table>

<div class="xref">
  <div class="xref-label">Related SOPs</div>
  <div class="xref-item">None yet</div>
</div>

<h2>10. Approval</h2>
<p>This SOP has been reviewed and approved by the following individuals. All parties below confirm the process documented above is accurate, complete, and ready for use.</p>

<table>
  <thead><tr><th>Role</th><th>Name</th><th>Date</th></tr></thead>
  <tbody>
    <tr><td>Prepared By (Maker)</td><td>${author || 'TBD'}</td><td>${today}</td></tr>
    <tr><td>Reviewed By (Checker)</td><td>${checker || 'TBD'}</td><td></td></tr>
    <tr><td>Approved By</td><td></td><td></td></tr>
  </tbody>
</table>

<h2>11. Review Schedule</h2>
<p>This SOP is reviewed at the end of each calendar quarter (March 31, June 30, September 30, December 31) and immediately upon any material change to the process, systems, or personnel involved. At each review, confirm all steps, contacts, system references, and procedures remain current and update the revision history below.</p>

<h2>12. Revision History</h2>
<table class="rev-table">
  <thead><tr>
    <th style="width:65px;">Version</th>
    <th style="width:110px;">Date</th>
    <th style="width:130px;">Author</th>
    <th>Changes</th>
  </tr></thead>
  <tbody>
    <tr>
      <td>1.0</td>
      <td>${today}</td>
      <td>${author || owner || 'TBD'}</td>
      <td>Initial publication</td>
    </tr>
  </tbody>
</table>

</div>`
}

/**
 * Wrap plain text content into the Vega SOP template.
 */
export function wrapContentInTemplate({ sopId, title, category, owner, author, reviewCadence, date, content }) {
  const today = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const htmlContent = content
    .split(/\n{2,}/)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  return `<header class="doc-header">
  ${VEGA_LOGO_SVG}
  <div class="header-label">procedures.vegarei.com</div>
</header>

<div class="title-block">
  <div class="sop-id">${sopId || 'SOP-001'}</div>
  <div class="sop-title">${title || 'Untitled Procedure'}</div>
</div>

<div class="meta-block">
  <p><strong>Version:</strong> 1.0</p>
  <p><strong>Effective:</strong> ${today}</p>
  <p><strong>Category:</strong> ${category || 'General'}</p>
  <p><strong>Owner:</strong> ${owner || 'TBD'}</p>
  <p><strong>Review Cycle:</strong> ${reviewCadence || 'Quarterly'}</p>
  <p><strong>Classification:</strong> Internal / Confidential</p>
</div>

<div class="doc-body">
${htmlContent}

<h2>Revision History</h2>
<table class="rev-table">
  <thead><tr>
    <th style="width:65px;">Version</th>
    <th style="width:110px;">Date</th>
    <th style="width:130px;">Author</th>
    <th>Changes</th>
  </tr></thead>
  <tbody>
    <tr>
      <td>1.0</td>
      <td>${today}</td>
      <td>${author || owner || 'TBD'}</td>
      <td>Initial publication</td>
    </tr>
  </tbody>
</table>
</div>`
}

export const DEFAULT_SOP_HTML = generateSopHtml({})

// ── Reconstruct template structure from plain HTML ──────────
// When SOP content round-trips through Google Docs, all template
// CSS classes are stripped.  This function detects the document
// structure by content patterns and re-wraps it in the canonical
// template markup so the .sop-document CSS renders correctly.

const SOP_ID_RE = /^[A-Z]{2,5}-[A-Z]{2,5}-\d{3}$/
const META_LABEL_RE = /^(Version|Effective|Category|Owner|Maker|Checker|Review Cycle|Classification)\s*:/i
const HEADER_LINES = [
  'vega private equity llc',
  'vega assisted living fund',
  'vega capital markets',
  'vega builders',
  'vega development',
  'vega hospice',
  'vega property management',
  'vega valuations',
  'vega rei',
  'procedures.vegarei.com',
]
const PHASE_RE = /^PHASE\s+(\d+)\s*/i
const SUB_LABEL_RE = /^\d+\.\d+\s+/

function stripGoogleStyles(html) {
  // Remove Google Docs inline style attributes and class attributes
  return html
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/<span>(.*?)<\/span>/gi, '$1')
}

function isMetaField(text) {
  return META_LABEL_RE.test(text.trim())
}

function parseMetaField(text) {
  const idx = text.indexOf(':')
  if (idx === -1) return null
  return { label: text.substring(0, idx).trim(), value: text.substring(idx + 1).trim() }
}

export function reconstructTemplate(html) {
  if (!html) return html

  // If the HTML already has the full template structure, return as-is
  if (html.includes('doc-header') && html.includes('title-block') && html.includes('doc-body')) {
    return html
  }

  // Strip Google's inline styles if present
  let cleaned = html.includes('docs-internal') || html.includes('style="') ? stripGoogleStyles(html) : html

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${cleaned}</div>`, 'text/html')
  const root = doc.body.firstChild
  const elements = [...root.children]

  let sopId = ''
  let title = ''
  let scope = ''
  const metaFields = []
  const bodyElements = []
  let phase = 'preamble' // preamble | meta | body

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const text = el.textContent.trim()
    const textLower = text.toLowerCase()

    // Skip empty elements
    if (!text) continue

    // Skip header/company name lines
    if (phase === 'preamble' && HEADER_LINES.includes(textLower)) continue

    // Detect SOP ID
    if (phase === 'preamble' && !sopId && SOP_ID_RE.test(text)) {
      sopId = text
      continue
    }

    // Detect title — first h1 or first substantial heading/text after SOP ID
    if (phase === 'preamble' && !title) {
      const tag = el.tagName
      if (tag === 'H1' || tag === 'H2' || (sopId && tag === 'P' && text.length > 3 && !isMetaField(text))) {
        title = text
        continue
      }
    }

    // Detect scope — paragraph after title, before meta fields
    if (phase === 'preamble' && title && !scope) {
      if (el.tagName === 'P' && !isMetaField(text) && !SOP_ID_RE.test(text)) {
        // Only treat as scope if it looks like a description (not a section heading)
        if (!text.match(/^\d+\.\s/) && text.length > 10) {
          scope = text
          continue
        }
      }
    }

    // Detect meta fields
    if (isMetaField(text)) {
      phase = 'meta'
      // Handle both "<strong>Label:</strong> Value" and "Label: Value"
      const parsed = parseMetaField(text)
      if (parsed) metaFields.push(parsed)
      continue
    }

    // Once we hit a section heading (h2) after finding meta/title, switch to body
    if (el.tagName === 'H2' && (metaFields.length > 0 || title)) {
      phase = 'body'
    }

    // If still in preamble/meta and it's not recognized, push to body
    if (phase !== 'body' && (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'TABLE')) {
      phase = 'body'
    }

    if (phase === 'body' || (phase !== 'preamble' && phase !== 'meta')) {
      phase = 'body'
      bodyElements.push(el)
    } else {
      // Unrecognized preamble content — add to body
      bodyElements.push(el)
    }
  }

  // Build the reconstructed HTML
  let result = ''

  // Header
  result += `<header class="doc-header">\n  ${VEGA_LOGO_SVG}\n  <div class="header-label">Vega Private Equity LLC<br>procedures.vegarei.com</div>\n</header>\n\n`

  // Title block
  if (sopId || title) {
    result += `<div class="title-block">\n`
    if (sopId) result += `  <div class="sop-id">${sopId}</div>\n`
    if (title) result += `  <div class="sop-title">${title}</div>\n`
    if (scope) result += `  <div class="sop-scope">${scope}</div>\n`
    result += `</div>\n\n`
  }

  // Meta block
  if (metaFields.length > 0) {
    result += `<div class="meta-block">\n`
    for (const f of metaFields) {
      result += `  <p><strong>${f.label}:</strong> ${f.value}</p>\n`
    }
    result += `</div>\n\n`
  }

  // Body — enhance elements with template classes
  result += `<div class="doc-body">\n`
  for (const el of bodyElements) {
    result += enhanceElement(el)
  }
  result += `</div>`

  return result
}

function enhanceElement(el) {
  const tag = el.tagName
  const text = el.textContent.trim()

  // h2 section headings — already styled by CSS, just output
  if (tag === 'H2') {
    return `<h2>${el.innerHTML}</h2>\n`
  }

  if (tag === 'H3') {
    return `<h3>${el.innerHTML}</h3>\n`
  }

  // Detect phase bars: paragraphs or bold text matching "PHASE N ..."
  if ((tag === 'P' || tag === 'DIV') && PHASE_RE.test(text)) {
    const match = text.match(PHASE_RE)
    const num = match[1]
    const rest = text.substring(match[0].length).trim()
    // Split remaining into title and note (if separated by — or -)
    const parts = rest.split(/\s*[—–-]\s*/)
    const phaseTitle = parts[0] || ''
    const phaseNote = parts.slice(1).join(' — ') || ''
    return `<div class="phase">\n  <span class="phase-num">PHASE ${num}</span>\n  <span class="phase-title">${phaseTitle}</span>\n${phaseNote ? `  <span class="phase-note">${phaseNote}</span>\n` : ''}</div>\n`
  }

  // Detect sub-labels: paragraphs like "1.1 Trigger", "2.3 Key Systems"
  if (tag === 'P' && SUB_LABEL_RE.test(text) && text.length < 60) {
    return `<div class="sub-label">${text}</div>\n`
  }

  // Tables — enhance role badges and step numbers in cells
  if (tag === 'TABLE') {
    return enhanceTable(el)
  }

  // Notice boxes — detect "Note:", "Important:", "Warning:" patterns
  if (tag === 'P' || tag === 'DIV') {
    if (text.match(/^(Note|Warning|Caution)\s*:/i)) {
      return `<div class="notice notice-alert">${el.innerHTML}</div>\n`
    }
    if (text.match(/^Important\s*:/i)) {
      return `<div class="notice notice-warn">${el.innerHTML}</div>\n`
    }
    if (text.match(/^(Tip|Info|Context)\s*:/i)) {
      return `<div class="notice notice-info">${el.innerHTML}</div>\n`
    }
  }

  // Cross-reference blocks
  if ((tag === 'P' || tag === 'DIV') && text.match(/^Related SOPs?\s*$/i)) {
    return `<div class="xref">\n  <div class="xref-label">${text}</div>\n</div>\n`
  }

  // Lists
  if (tag === 'UL' || tag === 'OL') {
    return el.outerHTML + '\n'
  }

  // Default: return as-is
  if (tag === 'P') {
    return `<p>${el.innerHTML}</p>\n`
  }

  return el.outerHTML + '\n'
}

function enhanceTable(tableEl) {
  const rows = [...tableEl.querySelectorAll('tr')]
  if (rows.length === 0) return tableEl.outerHTML + '\n'

  // Check if this looks like a revision history table
  const firstTh = tableEl.querySelector('th')
  const isRevTable = firstTh && firstTh.textContent.trim().toLowerCase() === 'version'

  // Check if this is a step table (has Step, Action, Role headers)
  const headers = [...tableEl.querySelectorAll('th')].map(th => th.textContent.trim().toLowerCase())
  const isStepTable = headers.includes('step') && headers.includes('action')

  let html = `<table${isRevTable ? ' class="rev-table"' : ''}>\n`

  rows.forEach((row, rowIdx) => {
    html += '<tr>\n'
    const cells = [...row.querySelectorAll('th, td')]

    cells.forEach((cell, colIdx) => {
      const isHeader = cell.tagName === 'TH'
      const tag = isHeader ? 'th' : 'td'
      let content = cell.innerHTML.trim()
      const cellText = cell.textContent.trim()

      // Style attributes for step table columns
      let attrs = ''
      if (isHeader && isStepTable) {
        if (colIdx === 0 && headers[0] === 'step') attrs = ' style="width:55px;"'
        if (headers[colIdx] === 'role') attrs = ' style="width:80px;"'
      }
      if (isHeader && isRevTable) {
        if (headers[colIdx] === 'version') attrs = ' style="width:65px;"'
        if (headers[colIdx] === 'date') attrs = ' style="width:110px;"'
        if (headers[colIdx] === 'author') attrs = ' style="width:130px;"'
      }
      if (isHeader && headers[colIdx] === 'verified by') attrs = ' style="width:100px;"'

      // Enhance role badges in non-header cells
      if (!isHeader && isStepTable) {
        // Step number column
        if (colIdx === 0 && cellText.match(/^\d{1,3}$/)) {
          content = `<span class="step-num">${cellText.padStart(2, '0')}</span>`
        }
        // Role column — wrap Maker/Checker in badge
        if (headers[colIdx] === 'role') {
          if (cellText.match(/^maker$/i)) content = '<span class="maker">Maker</span>'
          else if (cellText.match(/^checker$/i)) content = '<span class="checker">Checker</span>'
        }
      }

      // Also detect Maker/Checker in any table's cells
      if (!isHeader && !isStepTable) {
        if (cellText === 'Maker') content = '<span class="maker">Maker</span>'
        else if (cellText === 'Checker') content = '<span class="checker">Checker</span>'
      }

      html += `<${tag}${attrs}>${content}</${tag}>\n`
    })
    html += '</tr>\n'
  })

  html += '</table>\n'
  return html
}
