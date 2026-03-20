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
  await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${INDEX_FILE_ID}?uploadType=media`,
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

// ── Bump version number ────────────────────────────────────
export function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0`
  if (type === 'minor') return `${major}.${minor + 1}`
  return `${major}.${minor}.${(patch || 0) + 1}`
}

// ── Create a new file in Drive ───────────────────────────────
export async function createDriveFile(name, content, mimeType, token) {
  // Step 1: Create file metadata
  const metaRes = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, mimeType }),
    }
  )
  if (!metaRes.ok) throw new Error(`Drive create failed: ${metaRes.status}`)
  const file = await metaRes.json()

  // Step 2: Upload content
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType,
      },
      body: content,
    }
  )
  if (!uploadRes.ok) throw new Error(`Drive upload failed: ${uploadRes.status}`)
  return file
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
