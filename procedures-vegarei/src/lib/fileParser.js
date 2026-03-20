// Parse uploaded documents into plain text for AI reformatting
// mammoth is lazy-loaded to avoid bloating the initial bundle
export async function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  }

  if (ext === 'doc') {
    // .doc (old format) — try as text, warn if garbled
    const text = await file.text()
    // Filter out binary noise
    const clean = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ').replace(/\s{3,}/g, '\n\n').trim()
    if (clean.length < 50) {
      throw new Error('Could not parse .doc file. Please save it as .docx and try again.')
    }
    return clean
  }

  if (ext === 'txt' || ext === 'md') {
    return await file.text()
  }

  if (ext === 'pdf') {
    throw new Error('PDF upload is not yet supported. Please paste the content or upload a .docx or .txt file.')
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: .docx, .doc, .txt, .md`)
}
