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

// ── Category config ────────────────────────────────────────
export const CATEGORIES = {
  legal:      { label: 'Legal & Formation',  color: '#f5c542', folder: '01_Legal_Formation' },
  investor:   { label: 'Investor Relations', color: '#00d4ff', folder: '02_Investor_Relations' },
  compliance: { label: 'Compliance',         color: '#f97316', folder: '03_Compliance' },
  tax:        { label: 'Tax & Reporting',    color: '#22c55e', folder: '04_Tax_Reporting' },
  operations: { label: 'Operations',         color: '#a855f7', folder: '05_Operations' },
  marketing:  { label: 'Marketing',          color: '#ec4899', folder: '06_Marketing' },
  technology: { label: 'Technology',         color: '#6366f1', folder: '07_Technology' },
}
