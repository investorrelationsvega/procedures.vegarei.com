const INDEX_FILE_ID = import.meta.env.VITE_DRIVE_INDEX_FILE_ID

// ── Fetch a file's content from Drive ─────────────────────
export async function fetchDriveFile(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Drive fetch failed: ${res.status}`)
  return res.text()
}

// ── Fetch and parse JSON from Drive ───────────────────────
export async function fetchDriveJSON(fileId, token) {
  const text = await fetchDriveFile(fileId, token)
  return JSON.parse(text)
}

// ── Load the master SOP index ─────────────────────────────
export async function loadIndex(token) {
  return fetchDriveJSON(INDEX_FILE_ID, token)
}

// ── Load a single SOP's HTML ──────────────────────────────
export async function loadSopHtml(htmlFileId, token) {
  return fetchDriveFile(htmlFileId, token)
}

// ── Load a single SOP's metadata / revision history ───────
export async function loadSopMeta(metaFileId, token) {
  return fetchDriveJSON(metaFileId, token)
}

// ── Save updated HTML to Drive ────────────────────────────
export async function saveSopHtml(fileId, htmlContent, token) {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/html',
      },
      body: htmlContent,
    }
  )
  if (!res.ok) throw new Error(`Drive save failed: ${res.status}`)
  return res.json()
}

// ── Save updated meta JSON to Drive ───────────────────────
export async function saveSopMeta(fileId, meta, token) {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meta, null, 2),
    }
  )
  if (!res.ok) throw new Error(`Drive meta save failed: ${res.status}`)
  return res.json()
}

// ── Update the master index with new version info ─────────
export async function updateIndex(index, sopId, version, lastReviewed, token) {
  const updated = {
    ...index,
    lastUpdated: new Date().toISOString().split('T')[0],
    sops: index.sops.map(s =>
      s.id === sopId ? { ...s, version, lastReviewed } : s
    ),
  }
  await saveIndex(updated, token)
  return updated
}

// ── Update arbitrary fields on an SOP in the index ─────────
export async function updateSopInIndex(index, sopId, fields, token) {
  const updated = {
    ...index,
    lastUpdated: new Date().toISOString().split('T')[0],
    sops: index.sops.map(s =>
      s.id === sopId ? { ...s, ...fields } : s
    ),
  }
  await saveIndex(updated, token)
  return updated
}

// ── Save the full index back to Drive ──────────────────────
async function saveIndex(index, token) {
  await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${INDEX_FILE_ID}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(index, null, 2),
    }
  )
}

// ── Cache folder IDs in the index ──────────────────────────
export async function cacheFolderIds(index, companySlug, folderId, rootId, token) {
  const updated = {
    ...index,
    folderIds: {
      ...(index.folderIds || {}),
      root: rootId || index.folderIds?.root,
      [companySlug]: folderId,
    },
  }
  await saveIndex(updated, token)
  return updated
}

// ── Bump version number ────────────────────────────────────
export function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0`
  if (type === 'minor') return `${major}.${minor + 1}`
  return `${major}.${minor}.${(patch || 0) + 1}`
}

// ── Create a new Google Doc in Drive ─────────────────────────
// Creates a native Google Doc (not an HTML file) so it's editable in both
// the procedures site and directly in Google Drive.
// Uses Drive API import to convert HTML content into a Google Doc.
export async function createGoogleDoc(name, htmlContent, token, parentFolderId) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.document',
  }
  if (parentFolderId) metadata.parents = [parentFolderId]

  const boundary = '---vega_sop_boundary'
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n` +
    `${htmlContent}\r\n` +
    `--${boundary}--`

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  if (!res.ok) throw new Error(`Drive create Google Doc failed: ${res.status}`)
  return res.json()
}

// ── Create a new file in Drive ───────────────────────────────
// Uses multipart upload to prevent Google from converting files to Google Docs.
// The old two-step approach (create metadata → upload content) caused Drive to
// interpret mimeType as a conversion target, turning .html/.json into Google Docs.
export async function createDriveFile(name, content, mimeType, token, parentFolderId) {
  const metadata = { name, mimeType }
  if (parentFolderId) metadata.parents = [parentFolderId]

  const boundary = '---vega_sop_boundary'
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`)
  return res.json()
}

// ── Find or create a Drive folder ──────────────────────────
// Returns the folder ID, creating it (and parent) if it doesn't exist.
async function findFolder(name, parentId, token) {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
    (parentId ? ` and '${parentId}' in parents` : '')
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Drive folder search failed: ${res.status}`)
  const data = await res.json()
  return data.files?.[0]?.id || null
}

async function createFolder(name, parentId, token) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) metadata.parents = [parentId]

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  )
  if (!res.ok) throw new Error(`Drive folder create failed: ${res.status}`)
  const folder = await res.json()
  return folder.id
}

// Get (or create) the folder for a business unit:
//   Vega Procedures / {Business Unit Label}
// Caches folder IDs in the index to avoid repeated lookups.
export async function getCompanyFolder(companySlug, index, token) {
  // Check if we already have it cached in the index
  const cached = index?.folderIds?.[companySlug]
  if (cached) return cached

  const companyConfig = COMPANIES[companySlug]
  if (!companyConfig) return null

  // Find or create root "Vega Procedures" folder
  let rootId = index?.folderIds?.root || null
  if (!rootId) {
    rootId = await findFolder('Vega Procedures', null, token)
    if (!rootId) rootId = await createFolder('Vega Procedures', null, token)
  }

  // Find or create business unit folder inside root
  let buId = await findFolder(companyConfig.label, rootId, token)
  if (!buId) buId = await createFolder(companyConfig.label, rootId, token)

  return buId
}

// ── Add a new SOP to the master index ────────────────────────
export async function addSopToIndex(index, newSop, token) {
  const updated = {
    ...index,
    lastUpdated: new Date().toISOString().split('T')[0],
    sops: [...index.sops, newSop],
  }
  const INDEX_FILE = import.meta.env.VITE_DRIVE_INDEX_FILE_ID
  await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${INDEX_FILE}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated, null, 2),
    }
  )
  return updated
}

// ── Log an audit event (print, download, etc.) ──────────────
export async function logAuditEvent(metaFileId, meta, event, token) {
  if (!metaFileId) return meta
  const updatedMeta = {
    ...meta,
    auditLog: [event, ...(meta?.auditLog || [])],
  }
  await saveSopMeta(metaFileId, updatedMeta, token)
  return updatedMeta
}

// ── Category config ────────────────────────────────────────
// Flat lookup used for rendering (color, label, ID code)
export const CATEGORIES = {
  // Shared categories (used across multiple units)
  legal:          { label: 'Legal & Formation',    color: '#f5c542', code: 'LGL' },
  compliance:     { label: 'Compliance',           color: '#f97316', code: 'CMP' },
  operations:     { label: 'Operations',           color: '#a855f7', code: 'OPS' },
  finance:        { label: 'Finance & Accounting', color: '#22c55e', code: 'FIN' },
  hr:             { label: 'Human Resources',      color: '#ec4899', code: 'HR' },
  technology:     { label: 'Technology',           color: '#6366f1', code: 'TECH' },
  reporting:      { label: 'Reporting',            color: '#0ea5e9', code: 'RPT' },
  // Private Equity specific
  investor:       { label: 'Investor Relations',   color: '#00d4ff', code: 'INV' },
  'fund-admin':   { label: 'Fund Administration',  color: '#8b5cf6', code: 'FA' },
  tax:            { label: 'Tax & Reporting',      color: '#22c55e', code: 'TAX' },
  // Capital Markets specific
  origination:    { label: 'Origination',          color: '#06b6d4', code: 'ORG' },
  underwriting:   { label: 'Underwriting',         color: '#8b5cf6', code: 'UW' },
  closing:        { label: 'Closing',              color: '#14b8a6', code: 'CLS' },
  // Builders / Development
  safety:         { label: 'Safety',               color: '#ef4444', code: 'SAF' },
  procurement:    { label: 'Procurement',          color: '#f59e0b', code: 'PRC' },
  quality:        { label: 'Quality Assurance',    color: '#10b981', code: 'QA' },
  permits:        { label: 'Permits & Entitlements', color: '#a855f7', code: 'PRM' },
  construction:   { label: 'Construction',         color: '#78716c', code: 'CON' },
  'land-acq':     { label: 'Land Acquisition',     color: '#84cc16', code: 'LA' },
  // Healthcare (Assisted Living / Hospice)
  'patient-care': { label: 'Patient Care',         color: '#ef4444', code: 'PC' },
  billing:        { label: 'Billing',              color: '#f59e0b', code: 'BIL' },
  clinical:       { label: 'Clinical',             color: '#06b6d4', code: 'CLN' },
  // Property Management
  leasing:        { label: 'Leasing',              color: '#06b6d4', code: 'LSE' },
  maintenance:    { label: 'Maintenance',          color: '#78716c', code: 'MNT' },
  'tenant-rel':   { label: 'Tenant Relations',     color: '#ec4899', code: 'TR' },
  // Valuations
  appraisal:      { label: 'Appraisal',            color: '#f59e0b', code: 'APR' },
  review:         { label: 'Review',               color: '#8b5cf6', code: 'REV' },
  // Employee Handbook
  policies:       { label: 'Policies',             color: '#6366f1', code: 'POL' },
  benefits:       { label: 'Benefits',             color: '#22c55e', code: 'BEN' },
  conduct:        { label: 'Conduct',              color: '#f97316', code: 'CDT' },
}

// ── Business unit config ────────────────────────────────────
export const COMPANIES = {
  'assisted-living':     { label: 'Assisted Living',    prefix: 'ALM', categories: ['patient-care', 'clinical', 'compliance', 'operations', 'hr', 'finance', 'safety'] },
  'builders':            { label: 'Builders',           prefix: 'BLD', categories: ['construction', 'safety', 'procurement', 'quality', 'permits', 'operations', 'finance'] },
  'capital-markets':     { label: 'Capital Markets',    prefix: 'CM',  categories: ['origination', 'underwriting', 'closing', 'compliance', 'reporting', 'operations'] },
  'development':         { label: 'Development',        prefix: 'DEV', categories: ['land-acq', 'permits', 'construction', 'finance', 'compliance', 'operations'] },
  'hospice':             { label: 'Hospice',            prefix: 'HSP', categories: ['patient-care', 'clinical', 'compliance', 'billing', 'hr', 'operations'] },
  'private-equity':      { label: 'Private Equity',     prefix: 'PE',  categories: ['investor', 'fund-admin', 'compliance', 'tax', 'legal', 'operations'] },
  'property-management': { label: 'Property Management', prefix: 'PM', categories: ['leasing', 'maintenance', 'tenant-rel', 'finance', 'compliance', 'operations'] },
  'valuations':          { label: 'Valuations',         prefix: 'VAL', categories: ['appraisal', 'review', 'compliance', 'quality', 'reporting', 'operations'] },
  'employee-handbook':   { label: 'Employee Handbook',  prefix: 'EHB', categories: ['policies', 'benefits', 'conduct', 'hr', 'safety', 'technology'] },
}

// ── Review cadence config ────────────────────────────────────
export const REVIEW_CADENCES = {
  quarterly:   { label: 'Quarterly',   days: 90,  short: '90d' },
  biannually:  { label: 'Biannually',  days: 182, short: '6mo' },
  annually:    { label: 'Annually',    days: 365, short: '1yr' },
  'as-needed': { label: 'As Needed',   days: null, short: 'N/A' },
}

export function getReviewStatus(lastReviewed, cadence) {
  if (!cadence || cadence === 'as-needed') return 'on-track'
  const config = REVIEW_CADENCES[cadence]
  if (!config?.days) return 'on-track'
  const last = new Date(lastReviewed)
  const now = new Date()
  const diffDays = (now - last) / (1000 * 60 * 60 * 24)
  if (diffDays > config.days) return 'overdue'
  if (diffDays > config.days - 14) return 'due-soon'
  return 'on-track'
}

// ── List files in a Drive folder ─────────────────────────────
// Returns all non-trashed files in a folder (id, name, mimeType, modifiedTime).
export async function listFolderFiles(folderId, token) {
  const files = []
  let pageToken = ''
  do {
    const q = `'${folderId}' in parents and trashed=false`
    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,modifiedTime)&pageSize=100`
    if (pageToken) url += `&pageToken=${pageToken}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
    const data = await res.json()
    files.push(...(data.files || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return files
}

// ── Export a Google Doc as HTML ──────────────────────────────
// Google Docs use a proprietary format — this exports to clean HTML.
export async function exportGoogleDocAsHtml(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Drive export failed: ${res.status}`)
  const html = await res.text()
  // Google wraps export in full HTML doc — extract just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return bodyMatch ? bodyMatch[1].trim() : html
}

// ── Find unindexed files in a company's Drive folder ─────────
// Compares folder contents against the index to find files that
// exist in Drive but don't have a corresponding SOP entry.
export async function findUnindexedFiles(companySlug, index, token) {
  const folderId = index?.folderIds?.[companySlug]
  if (!folderId) return []

  const files = await listFolderFiles(folderId, token)

  // Build a set of known Drive file IDs from the index
  const knownIds = new Set()
  ;(index.sops || []).forEach(sop => {
    if (sop.htmlFileId) knownIds.add(sop.htmlFileId)
    if (sop.metaFileId) knownIds.add(sop.metaFileId)
  })

  // Filter to files not in the index and not meta.json files
  const importable = files.filter(f => {
    if (knownIds.has(f.id)) return false
    if (f.name.endsWith('.meta.json')) return false
    if (f.mimeType === 'application/vnd.google-apps.folder') return false
    // Accept Google Docs, HTML, text, docx
    const importableTypes = [
      'application/vnd.google-apps.document',
      'text/html',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    return importableTypes.includes(f.mimeType) || f.name.match(/\.(html|txt|md|docx)$/i)
  })

  return importable
}

// ── Auto-generate SOP ID ────────────────────────────────────
// Format: PREFIX-CODE-NNN (e.g. PE-INV-001)
export function generateSopId(companySlug, categoryKey, existingSops) {
  const company = COMPANIES[companySlug]
  const category = CATEGORIES[categoryKey]
  if (!company || !category) return 'SOP-001'

  const prefix = `${company.prefix}-${category.code}`
  // Count existing SOPs with same prefix
  const existing = existingSops.filter(s => s.id.startsWith(prefix))
  const nextNum = existing.length + 1
  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}
