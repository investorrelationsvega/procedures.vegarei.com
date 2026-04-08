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

// ── Parse .docx (Office Open XML) ───────────────────────────
// .docx is a zip archive. We read the central directory to find
// word/document.xml, decompress it, and extract text from the XML.

async function parseDocx(file) {
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)
  const view = new DataView(buffer)

  // Find End of Central Directory Record (EOCD)
  // Signature: PK\x05\x06
  let eocdOffset = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) throw new Error('Invalid .docx file (no EOCD found)')

  const totalEntries = view.getUint16(eocdOffset + 10, true)
  const cdSize = view.getUint32(eocdOffset + 12, true)
  const cdOffset = view.getUint32(eocdOffset + 16, true)

  // Walk the central directory looking for word/document.xml
  let entryOffset = cdOffset
  let xmlContent = null

  for (let i = 0; i < totalEntries; i++) {
    // Central Directory Header signature: PK\x01\x02
    if (data[entryOffset] !== 0x50 || data[entryOffset + 1] !== 0x4b ||
        data[entryOffset + 2] !== 0x01 || data[entryOffset + 3] !== 0x02) {
      throw new Error('Invalid .docx file (bad central directory entry)')
    }

    const compMethod = view.getUint16(entryOffset + 10, true)
    const compSize = view.getUint32(entryOffset + 20, true)
    const uncompSize = view.getUint32(entryOffset + 24, true)
    const nameLen = view.getUint16(entryOffset + 28, true)
    const extraLen = view.getUint16(entryOffset + 30, true)
    const commentLen = view.getUint16(entryOffset + 32, true)
    const localHeaderOffset = view.getUint32(entryOffset + 42, true)

    const nameBytes = data.slice(entryOffset + 46, entryOffset + 46 + nameLen)
    const fileName = new TextDecoder().decode(nameBytes)

    if (fileName === 'word/document.xml') {
      // Read local file header to get its name and extra field lengths
      // Local header signature: PK\x03\x04
      if (data[localHeaderOffset] !== 0x50 || data[localHeaderOffset + 1] !== 0x4b ||
          data[localHeaderOffset + 2] !== 0x03 || data[localHeaderOffset + 3] !== 0x04) {
        throw new Error('Invalid .docx file (bad local file header)')
      }
      const localNameLen = view.getUint16(localHeaderOffset + 26, true)
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
      const compressed = data.slice(dataStart, dataStart + compSize)

      if (compMethod === 0) {
        // Stored
        xmlContent = new TextDecoder().decode(compressed)
      } else if (compMethod === 8) {
        // Deflate
        xmlContent = await decompressDeflate(compressed)
      } else {
        throw new Error(`Unsupported compression method: ${compMethod}`)
      }
      break
    }

    entryOffset += 46 + nameLen + extraLen + commentLen
  }

  if (!xmlContent) throw new Error('Could not find word/document.xml in the .docx file')

  // Parse the XML and extract text from <w:t> elements, with paragraph breaks
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'application/xml')

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
    lines.push(line)
  }

  const result = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!result) throw new Error('The .docx file appears to be empty.')
  return result
}

// Decompress deflate-raw data using the browser's DecompressionStream API
async function decompressDeflate(compressed) {
  const stream = new Blob([compressed]).stream().pipeThrough(
    new DecompressionStream('deflate-raw')
  )
  const reader = stream.getReader()
  const chunks = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  for (const chunk of chunks) {
    result.set(chunk, pos)
    pos += chunk.length
  }
  return new TextDecoder().decode(result)
}
