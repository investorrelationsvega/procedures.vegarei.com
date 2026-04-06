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

// Parse .docx (Office Open XML) by extracting text from the zip
async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  // .docx is a zip file - find and extract word/document.xml
  const xmlContent = extractFileFromZip(uint8, 'word/document.xml')
  if (!xmlContent) throw new Error('Could not read .docx file. The file may be corrupted.')

  // Parse the XML and extract text content
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'application/xml')

  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const paragraphs = doc.getElementsByTagNameNS(ns, 'p')
  const lines = []

  for (const p of paragraphs) {
    const texts = []
    const runs = p.getElementsByTagNameNS(ns, 'r')
    for (const r of runs) {
      const tElements = r.getElementsByTagNameNS(ns, 't')
      for (const t of tElements) {
        if (t.textContent) texts.push(t.textContent)
      }
    }
    const line = texts.join('')
    lines.push(line)
  }

  const result = lines.join('\n').trim()
  if (!result) throw new Error('The .docx file appears to be empty.')
  return result
}

// Minimal zip extraction - finds a file by name in a zip archive
function extractFileFromZip(data, targetName) {
  // Find local file headers (PK\x03\x04)
  let offset = 0
  while (offset < data.length - 4) {
    if (data[offset] === 0x50 && data[offset + 1] === 0x4B &&
        data[offset + 2] === 0x03 && data[offset + 3] === 0x04) {

      const nameLen = data[offset + 26] | (data[offset + 27] << 8)
      const extraLen = data[offset + 28] | (data[offset + 29] << 8)
      const compMethod = data[offset + 8] | (data[offset + 9] << 8)
      const compSize = data[offset + 18] | (data[offset + 19] << 8) |
                       (data[offset + 20] << 16) | (data[offset + 21] << 24)

      const nameBytes = data.slice(offset + 30, offset + 30 + nameLen)
      const fileName = new TextDecoder().decode(nameBytes)

      const dataStart = offset + 30 + nameLen + extraLen

      if (fileName === targetName) {
        if (compMethod === 0) {
          // Stored (no compression)
          const fileData = data.slice(dataStart, dataStart + compSize)
          return new TextDecoder().decode(fileData)
        } else if (compMethod === 8) {
          // Deflated - use DecompressionStream
          const compressed = data.slice(dataStart, dataStart + compSize)
          return decompressDeflate(compressed)
        }
      }

      offset = dataStart + compSize
    } else {
      offset++
    }
  }
  return null
}

// Decompress deflate data using the browser's DecompressionStream API
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
