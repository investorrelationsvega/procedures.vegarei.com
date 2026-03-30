/**
 * Drive read/write service for SOP content.
 * Uses Google Drive API v3.
 */

/**
 * Fetch the raw HTML content of a file from Drive by file ID.
 */
export async function fetchFileContent(fileId, accessToken) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) {
    throw new Error('Session expired, please sign in again.')
  }
  if (!res.ok) throw new Error(`Drive fetch failed: ${res.status}`)
  return res.text()
}

/**
 * Save updated HTML content back to a file in Drive by file ID.
 * Uses multipart PATCH upload.
 */
export async function saveFileContent(fileId, htmlContent, accessToken) {
  const metadata = JSON.stringify({ mimeType: 'text/html' })
  const boundary = '---vega_drive_boundary'

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n` +
    `${htmlContent}\r\n` +
    `--${boundary}--`

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  if (res.status === 401) {
    throw new Error('Session expired, please sign in again.')
  }
  if (!res.ok) throw new Error(`Drive save failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch and parse _index.json from Drive.
 */
export async function fetchIndex(indexFileId, accessToken) {
  const text = await fetchFileContent(indexFileId, accessToken)
  return JSON.parse(text)
}
