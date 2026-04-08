import { unzipSync, strFromU8 } from 'fflate'

// Parse uploaded documents into text or HTML content
export async function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'html' || ext === 'htm') {
    const html = await file.text()
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    return bodyMatch ? bodyMatch[1].trim() : html.trim()
  }

  if (ext === 'txt' || ext === 'md') {
    return await file.text()
  }

  if (ext === 'docx') {
    return await parseDocx(file)
  }

  if (ext === 'doc') {
    throw new Error('Legacy .doc format is not supported. Please save as .docx, .html, or .txt.')
  }

  if (ext === 'pdf') {
    throw new Error('PDF upload is not yet supported. Please paste the content or upload a .docx, .html, or .txt file.')
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: .docx, .html, .txt, .md`)
}

// ── Parse .docx ────────────────────────────────────────────────
// .docx is a zip archive. We unzip it, find word/document.xml,
// and extract text from the <w:p> paragraph and <w:t> text elements.

async function parseDocx(file) {
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)

  let unzipped
  try {
    unzipped = unzipSync(data)
  } catch (err) {
    throw new Error(`Could not read .docx file: ${err.message}`)
  }

  const docXml = unzipped['word/document.xml']
  if (!docXml) {
    throw new Error('Could not find word/document.xml inside the .docx file')
  }

  const xmlContent = strFromU8(docXml)

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Could not parse .docx XML content')
  }

  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const paragraphs = doc.getElementsByTagNameNS(ns, 'p')
  const lines = []

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]
    const textNodes = p.getElementsByTagNameNS(ns, 't')
    let line = ''
    for (let j = 0; j < textNodes.length; j++) {
      line += textNodes[j].textContent || ''
    }
    // Also handle line breaks within paragraphs
    const breaks = p.getElementsByTagNameNS(ns, 'br')
    if (breaks.length > 0 && line) {
      // Simple handling: just add the text. <w:br> within a paragraph is rare.
    }
    lines.push(line)
  }

  const result = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!result) throw new Error('The .docx file appears to be empty.')
  return result
}
