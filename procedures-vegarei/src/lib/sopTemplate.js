// ── Vega SOP Template ──────────────────────────────────────
// Master template based on the Vega SOP document format.
// All SOPs use this structure for uniformity.

// CSS for the SOP document — embedded in every SOP so it renders
// correctly both on the procedures site and as a standalone Google Doc.
export const SOP_STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --black: #000000; --night-sky: #27474D; --meteorite: #566F69;
  --space-grey: #797469; --neptune: #6A8F78; --moon-dust: #FDF6E5;
  --white: #FFFFFF; --border: #e8e8e8; --bg-subtle: #fafafa;
  --inter: 'Inter', sans-serif; --mono: 'Space Mono', monospace;
}
body { font-family: var(--inter); font-size: 10.5pt; line-height: 1.65; color: var(--black); }
.doc-header { padding: 24px 0 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid var(--black); }
.header-right { font-family: var(--mono); font-size: 7pt; color: #aaa; letter-spacing: 0.18em; text-align: right; line-height: 1.8; }
.title-block { padding: 32px 0 24px; }
.doc-id { font-family: var(--mono); font-size: 7pt; color: #aaa; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
.doc-id::after { content: ''; flex: 1; height: 1px; background: var(--border); }
h1 { font-family: var(--inter); font-size: 32pt; font-weight: 700; letter-spacing: -0.025em; line-height: 1.08; color: var(--black); margin-bottom: 10px; }
.scope { font-size: 9.5pt; color: var(--space-grey); }
.meta-strip { display: flex; background: var(--bg-subtle); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.meta-cell { padding: 11px 24px 11px 0; margin-right: 24px; border-right: 1px solid var(--border); }
.meta-cell:first-child { padding-left: 0; }
.meta-cell:last-child { border-right: none; }
.meta-cell .ml { font-family: var(--mono); font-size: 6pt; color: #bbb; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 2px; }
.meta-cell .mv { font-family: var(--inter); font-size: 9pt; font-weight: 600; color: var(--black); }
h2.sh { font-family: var(--mono); font-size: 7pt; font-weight: 700; color: var(--black); letter-spacing: 0.28em; text-transform: uppercase; margin: 36px 0 10px; display: flex; align-items: center; gap: 10px; }
h2.sh::after { content: ''; flex: 1; height: 1px; background: var(--border); }
h2.sh:first-child { margin-top: 0; }
p { font-size: 10pt; color: #222; line-height: 1.7; margin-bottom: 8px; }
ul, ol { padding-left: 22px; margin-bottom: 10px; }
li { font-size: 10pt; line-height: 1.65; margin-bottom: 4px; color: #222; }
li::marker { color: var(--space-grey); }
strong { font-weight: 600; }
.sub-label { font-family: var(--mono); font-size: 7pt; color: var(--space-grey); letter-spacing: 0.18em; text-transform: uppercase; margin: 20px 0 8px; font-weight: 700; }
.phase { display: flex; align-items: center; gap: 12px; background: var(--black); padding: 9px 14px; border-radius: 4px; margin: 28px 0 16px; }
.phase-num { font-family: var(--mono); font-size: 7pt; color: #666; font-weight: 700; flex-shrink: 0; }
.phase-title { font-family: var(--mono); font-size: 7.5pt; font-weight: 700; color: var(--white); letter-spacing: 0.18em; text-transform: uppercase; }
.phase-note { font-family: var(--mono); font-size: 6.5pt; color: #666; margin-left: auto; letter-spacing: 0.1em; }
.step-table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 9.5pt; }
.step-table th { font-family: var(--mono); font-size: 6pt; letter-spacing: 0.2em; text-transform: uppercase; color: #aaa; font-weight: 700; text-align: left; padding: 7px 12px; border-bottom: 1.5px solid var(--black); background: var(--bg-subtle); }
.step-table td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: top; line-height: 1.55; }
.step-table tr:last-child td { border-bottom: none; }
.step-table tr:nth-child(even) td { background: var(--bg-subtle); }
.step-num { font-family: var(--mono); font-size: 8pt; font-weight: 700; color: var(--night-sky); white-space: nowrap; }
.step-action { font-weight: 600; font-size: 9.5pt; margin-bottom: 3px; }
.step-detail { font-size: 9pt; color: #555; }
.role-badge { display: inline-block; font-family: var(--mono); font-size: 6pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; white-space: nowrap; }
.role-maker { background: #e8f0fe; color: #174ea6; }
.role-checker { background: #fce8e6; color: #c5221f; }
.data-table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 9pt; }
.data-table th { font-family: var(--mono); font-size: 6pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--white); background: var(--black); font-weight: 700; text-align: left; padding: 8px 11px; }
.data-table td { padding: 8px 11px; border-bottom: 1px solid var(--border); vertical-align: top; line-height: 1.5; }
.data-table tr:nth-child(even) td { background: var(--bg-subtle); }
.data-table tr:last-child td { border-bottom: none; }
.notice { border-left: 3px solid; padding: 10px 14px; margin: 14px 0; font-size: 9.5pt; line-height: 1.6; border-radius: 0 3px 3px 0; }
.notice-warn { border-color: #f5c542; background: #fffcf0; color: #5a3e00; }
.notice-info { border-color: #00d4ff; background: #f0fbff; color: #00455a; }
.notice-alert { border-color: #f97316; background: #fff8f5; color: #7c2800; }
.notice-green { border-color: #22c55e; background: #f0fff4; color: #14532d; }
.trigger-next { background: var(--moon-dust); border: 1px solid #e8dfc8; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }
.trigger-next .tn-label { font-family: var(--mono); font-size: 6pt; letter-spacing: 0.2em; text-transform: uppercase; color: #999; margin-bottom: 8px; }
.trigger-next .tn-items { display: flex; gap: 8px; flex-wrap: wrap; }
.trigger-next .tn-item { font-family: var(--mono); font-size: 8pt; font-weight: 700; color: var(--night-sky); background: white; border: 1px solid #d0c8b4; padding: 4px 10px; border-radius: 2px; }
.rev-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 10px; }
.rev-table th { font-family: var(--mono); font-size: 6pt; letter-spacing: 0.2em; text-transform: uppercase; color: #aaa; font-weight: 700; text-align: left; padding: 6px 10px; border-bottom: 1.5px solid var(--black); background: var(--bg-subtle); }
.rev-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
.rev-table tr:last-child td { border-bottom: none; }
`

// The Vega logo SVG path for the header
const VEGA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1602.14 586.87" height="28" style="display:block;"><polygon points="474.94 371.81 694.38 371.81 694.38 320.83 474.94 320.83 474.94 184.06 727.34 184.06 727.34 133.09 416.51 133.09 416.51 575.71 733.55 575.71 733.55 524.74 474.94 524.74 474.94 371.81"/><path d="M1441.79,133.12h-62.16l-169.15,442.55h62.82l51.03-135.47,18-51.03,67.08-183.39h1.3l63.46,183.39,18,51.03,47.27,135.47h62.69l-160.34-442.55Z"/><path d="M0,133.09h64.04l115.63,361.8h1.24l123.09-361.8h61.54l-157.28,442.62h-60.3L0,133.09Z"/><path d="M182.77,0c-8.8,61.66-27.56,110.27-51.34,133.09,23.79,22.82,42.54,71.43,51.34,133.09,8.8-61.66,27.56-110.27,51.34-133.09-23.79-22.82-42.54-71.43-51.34-133.09Z"/><path d="M965.68,381.82h137.75v129.49c-10.38,6.49-21.85,11.63-34.51,15.59-19.29,6.09-40.54,9.07-63.72,9.07-27.33,0-51.03-5.05-71.23-15.28-20.07-10.1-36.65-23.7-49.73-40.67-12.95-16.97-22.66-36.78-28.88-59.06-6.22-22.41-9.33-45.85-9.33-70.33s3.63-46.11,10.88-67.74c7.25-21.5,17.74-40.41,31.47-56.6,13.6-16.19,30.3-29.01,49.99-38.85,19.69-9.71,41.96-14.63,66.82-14.63,21.12,0,39.89,2.46,56.21,7.25,16.45,4.79,30.56,11.27,42.61,19.56,8.28,5.7,16.7,12.56,23.96,20.08l33.41-43.52c-9.45-8.81-21.11-16.84-29.14-21.76-18-11.01-37.68-18.52-59.31-24.09-21.5-5.7-44.17-8.42-67.74-8.42-35.62,0-67.22,6.73-94.8,20.2-27.58,13.47-50.9,31.21-69.94,53.1-19.04,22.02-33.42,46.88-43.13,74.6-9.84,27.84-14.63,55.95-14.63,84.57,0,34.45,5.05,65.92,15.15,94.54,10.23,28.49,24.87,53.1,44.17,73.56,19.29,20.59,42.74,36.39,70.2,47.66,27.58,11.14,58.54,16.71,92.99,16.71,31.09,0,65.15-2.59,92.73-12.95,2.48-.88,5.08-1.96,7.76-3.17h0c.16-.07.32-.14.48-.22.19-.09.38-.17.58-.26,16.42-7.43,35.61-19.49,51.54-35.86v-207.45h-192.61v54.86Z"/></svg>`

/**
 * Generate a complete SOP HTML document from metadata.
 * Used as the default when creating a blank SOP or wrapping uploaded text content.
 */
export function generateSopHtml({ sopId, title, scope, category, owner, author, reviewCadence, date }) {
  const today = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return `<header class="doc-header">
  ${VEGA_LOGO_SVG}
  <div class="header-right">PROCEDURES.VEGAREI.COM</div>
</header>

<div class="title-block">
  <div class="doc-id">${sopId || 'SOP-001'} &nbsp;&middot;&nbsp; ${category || 'General'}</div>
  <h1>${title || 'Untitled Procedure'}</h1>
  <p class="scope">${scope || 'Define the scope of this procedure.'}</p>
</div>

<div class="meta-strip">
  <div class="meta-cell"><div class="ml">Version</div><div class="mv">1.0</div></div>
  <div class="meta-cell"><div class="ml">Effective</div><div class="mv">${today}</div></div>
  <div class="meta-cell"><div class="ml">Owner</div><div class="mv">${owner || 'TBD'}</div></div>
  <div class="meta-cell"><div class="ml">Review Cycle</div><div class="mv">${reviewCadence || 'Quarterly'}</div></div>
</div>

<div class="doc-body">

  <h2 class="sh">1 &middot; Overview</h2>
  <p>Describe the purpose and context of this procedure.</p>

  <h2 class="sh">2 &middot; Procedure</h2>

  <div class="phase">
    <span class="phase-num">PHASE 1</span>
    <span class="phase-title">Phase Title</span>
  </div>

  <table class="step-table">
    <thead>
      <tr><th style="width:60px;">Step</th><th>Action</th><th style="width:90px;">Role</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="step-num">01</span></td>
        <td>
          <div class="step-action">Action description</div>
          <div class="step-detail">Additional detail and context.</div>
        </td>
        <td><span class="role-badge role-maker">Owner</span></td>
      </tr>
    </tbody>
  </table>

  <h2 class="sh">3 &middot; Related Documents</h2>
  <div class="trigger-next">
    <div class="tn-label">Cross-reference</div>
    <div class="tn-items">
      <span class="tn-item">Related SOP or document</span>
    </div>
  </div>

  <h2 class="sh">4 &middot; Revision History</h2>
  <table class="rev-table">
    <thead>
      <tr>
        <th style="width:60px;">Version</th>
        <th style="width:110px;">Date</th>
        <th style="width:120px;">Author</th>
        <th>Changes</th>
      </tr>
    </thead>
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
 * Wrap plain text content (from .txt or .md uploads) into the Vega SOP template.
 * Splits on double-newlines into paragraphs and preserves single newlines as <br>.
 */
export function wrapContentInTemplate({ sopId, title, category, owner, author, reviewCadence, date, content }) {
  const today = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Convert plain text to basic HTML paragraphs
  const htmlContent = content
    .split(/\n{2,}/)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n  ')

  return `<header class="doc-header">
  ${VEGA_LOGO_SVG}
  <div class="header-right">PROCEDURES.VEGAREI.COM</div>
</header>

<div class="title-block">
  <div class="doc-id">${sopId || 'SOP-001'} &nbsp;&middot;&nbsp; ${category || 'General'}</div>
  <h1>${title || 'Untitled Procedure'}</h1>
</div>

<div class="meta-strip">
  <div class="meta-cell"><div class="ml">Version</div><div class="mv">1.0</div></div>
  <div class="meta-cell"><div class="ml">Effective</div><div class="mv">${today}</div></div>
  <div class="meta-cell"><div class="ml">Owner</div><div class="mv">${owner || 'TBD'}</div></div>
  <div class="meta-cell"><div class="ml">Review Cycle</div><div class="mv">${reviewCadence || 'Quarterly'}</div></div>
</div>

<div class="doc-body">
  ${htmlContent}

  <h2 class="sh">Revision History</h2>
  <table class="rev-table">
    <thead>
      <tr>
        <th style="width:60px;">Version</th>
        <th style="width:110px;">Date</th>
        <th style="width:120px;">Author</th>
        <th>Changes</th>
      </tr>
    </thead>
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

// Legacy export for backwards compat
export const DEFAULT_SOP_HTML = generateSopHtml({})
