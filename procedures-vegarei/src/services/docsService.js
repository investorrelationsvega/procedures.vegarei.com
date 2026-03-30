/**
 * Google Docs API v1 service.
 * Converts between Docs JSON format and clean HTML.
 */

const DOCS_API = 'https://docs.googleapis.com/v1/documents'
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'

function handleAuthError(res) {
  if (res.status === 401) {
    throw new Error('Session expired, please sign in again.')
  }
}

// ── Fetch & convert Google Doc → HTML ─────────────────────────

export async function fetchDocContent(docId, accessToken) {
  const res = await fetch(`${DOCS_API}/${docId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  handleAuthError(res)
  if (!res.ok) throw new Error(`Docs API fetch failed: ${res.status}`)
  const doc = await res.json()
  return docJsonToHtml(doc)
}

// ── Save HTML → Google Doc via batchUpdate ────────────────────

export async function saveDocContent(docId, htmlContent, accessToken) {
  // 1. Get the current document to know its length
  const getRes = await fetch(`${DOCS_API}/${docId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  handleAuthError(getRes)
  if (!getRes.ok) throw new Error(`Docs API fetch failed: ${getRes.status}`)
  const doc = await getRes.json()

  const endIndex = doc.body.content[doc.body.content.length - 1].endIndex

  // 2. Build requests: clear existing content, then insert new content
  const requests = []

  // Delete all content except the final newline (index 1 to endIndex-1)
  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    })
  }

  // Parse HTML into structured blocks and build insert requests
  const insertRequests = htmlToDocsRequests(htmlContent)
  requests.push(...insertRequests)

  if (requests.length === 0) return

  // 3. Execute batchUpdate
  const updateRes = await fetch(`${DOCS_API}/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })
  handleAuthError(updateRes)
  if (!updateRes.ok) {
    const err = await updateRes.text()
    throw new Error(`Docs API save failed: ${updateRes.status} — ${err}`)
  }
  return updateRes.json()
}

// ── Fetch and parse _index.json from Drive ────────────────────

export async function fetchIndex(indexFileId, accessToken) {
  const res = await fetch(`${DRIVE_API}/${indexFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  handleAuthError(res)
  if (!res.ok) throw new Error(`Drive fetch failed: ${res.status}`)
  return res.json()
}


// ═══════════════════════════════════════════════════════════════
// Google Docs JSON → HTML conversion
// ═══════════════════════════════════════════════════════════════

function docJsonToHtml(doc) {
  const body = doc.body?.content || []
  const lists = doc.lists || {}
  let html = ''
  let currentListId = null
  let currentListTag = null

  for (const element of body) {
    if (element.paragraph) {
      const para = element.paragraph
      const namedStyle = para.paragraphStyle?.namedStyleType || 'NORMAL_TEXT'
      const bullet = para.bullet
      const textContent = paragraphToHtml(para)

      // Handle list items
      if (bullet) {
        const listId = bullet.listId
        const listProps = lists[listId]
        const nestingLevel = bullet.nestingLevel || 0
        const glyphType = listProps?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType
        const tag = (glyphType && glyphType !== 'GLYPH_TYPE_UNSPECIFIED' && !glyphType.startsWith('ALPHA') && !glyphType.startsWith('ROMAN') && !glyphType.startsWith('DECIMAL'))
          ? 'ul'
          : (glyphType === undefined || glyphType === 'GLYPH_TYPE_UNSPECIFIED') ? 'ul' : 'ol'

        if (currentListId !== listId || currentListTag !== tag) {
          if (currentListId !== null) html += `</${currentListTag}>\n`
          html += `<${tag}>\n`
          currentListId = listId
          currentListTag = tag
        }
        html += `<li>${textContent}</li>\n`
        continue
      }

      // Close any open list
      if (currentListId !== null) {
        html += `</${currentListTag}>\n`
        currentListId = null
        currentListTag = null
      }

      // Map named styles to HTML tags
      switch (namedStyle) {
        case 'HEADING_1':
          html += `<h1>${textContent}</h1>\n`
          break
        case 'HEADING_2':
          html += `<h2>${textContent}</h2>\n`
          break
        case 'HEADING_3':
          html += `<h3>${textContent}</h3>\n`
          break
        default:
          if (textContent.trim()) {
            html += `<p>${textContent}</p>\n`
          }
          break
      }
    } else if (element.table) {
      // Close any open list
      if (currentListId !== null) {
        html += `</${currentListTag}>\n`
        currentListId = null
        currentListTag = null
      }
      html += tableToHtml(element.table)
    }
  }

  // Close any trailing list
  if (currentListId !== null) {
    html += `</${currentListTag}>\n`
  }

  return html.trim()
}

function paragraphToHtml(para) {
  let html = ''
  for (const element of (para.elements || [])) {
    if (element.textRun) {
      const text = element.textRun.content
      if (text === '\n') continue // skip trailing newlines
      const style = element.textRun.textStyle || {}
      let fragment = escapeHtml(text.replace(/\n$/, ''))
      if (style.bold) fragment = `<strong>${fragment}</strong>`
      if (style.italic) fragment = `<em>${fragment}</em>`
      if (style.underline) fragment = `<u>${fragment}</u>`
      html += fragment
    }
  }
  return html
}

function tableToHtml(table) {
  let html = '<table>\n'
  const rows = table.tableRows || []
  rows.forEach((row, rowIdx) => {
    html += '<tr>\n'
    for (const cell of (row.tableCells || [])) {
      const tag = rowIdx === 0 ? 'th' : 'td'
      let cellContent = ''
      for (const content of (cell.content || [])) {
        if (content.paragraph) {
          cellContent += paragraphToHtml(content.paragraph)
        }
      }
      html += `<${tag}>${cellContent}</${tag}>\n`
    }
    html += '</tr>\n'
  })
  html += '</table>\n'
  return html
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}


// ═══════════════════════════════════════════════════════════════
// HTML → Google Docs batchUpdate requests
// ═══════════════════════════════════════════════════════════════

function htmlToDocsRequests(html) {
  const blocks = parseHtmlBlocks(html)
  if (blocks.length === 0) return []

  // Build text and formatting from the end of the document backwards.
  // We insert at index 1 (right after doc start), and process blocks
  // in reverse order so we don't need to track shifting indices.
  const requests = []
  const reversedBlocks = [...blocks].reverse()

  for (const block of reversedBlocks) {
    if (block.type === 'table') {
      // Insert table
      requests.push({
        insertTable: {
          rows: block.rows.length,
          columns: block.rows[0]?.length || 2,
          location: { index: 1 },
        },
      })
      // Table content will be populated after the table is created.
      // For simplicity, we'll add a post-processing step or populate via text inserts.
      // Note: Docs API insertTable creates an empty table; cell text requires
      // separate insertText calls with cell indices which we can't compute
      // without reading back the doc. We'll handle tables with a two-pass approach.
      block._needsPopulation = true
    } else if (block.type === 'list') {
      // Insert list items as newline-separated text, then apply bullet styling
      for (let i = block.items.length - 1; i >= 0; i--) {
        const item = block.items[i]
        requests.push({ insertText: { text: item.text + '\n', location: { index: 1 } } })
        // Apply bullet/number list
        requests.push({
          createParagraphBullets: {
            range: { startIndex: 1, endIndex: 1 + item.text.length + 1 },
            bulletPreset: block.ordered ? 'NUMBERED_DECIMAL_NESTED' : 'BULLET_DISC_CIRCLE_SQUARE',
          },
        })
        // Apply inline formatting
        if (item.runs) {
          let offset = 1
          for (const run of item.runs) {
            if (run.bold || run.italic || run.underline) {
              requests.push({
                updateTextStyle: {
                  range: { startIndex: offset, endIndex: offset + run.text.length },
                  textStyle: {
                    ...(run.bold ? { bold: true } : {}),
                    ...(run.italic ? { italic: true } : {}),
                    ...(run.underline ? { underline: true } : {}),
                  },
                  fields: [
                    run.bold ? 'bold' : '',
                    run.italic ? 'italic' : '',
                    run.underline ? 'underline' : '',
                  ].filter(Boolean).join(','),
                },
              })
            }
            offset += run.text.length
          }
        }
      }
    } else {
      // Paragraph / heading
      const text = block.text + '\n'
      requests.push({ insertText: { text, location: { index: 1 } } })

      // Apply heading style
      if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
        const namedStyleMap = { h1: 'HEADING_1', h2: 'HEADING_2', h3: 'HEADING_3' }
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: 1, endIndex: 1 + text.length },
            paragraphStyle: { namedStyleType: namedStyleMap[block.type] },
            fields: 'namedStyleType',
          },
        })
      }

      // Apply inline formatting
      if (block.runs) {
        let offset = 1
        for (const run of block.runs) {
          if (run.bold || run.italic || run.underline) {
            requests.push({
              updateTextStyle: {
                range: { startIndex: offset, endIndex: offset + run.text.length },
                textStyle: {
                  ...(run.bold ? { bold: true } : {}),
                  ...(run.italic ? { italic: true } : {}),
                  ...(run.underline ? { underline: true } : {}),
                },
                fields: [
                  run.bold ? 'bold' : '',
                  run.italic ? 'italic' : '',
                  run.underline ? 'underline' : '',
                ].filter(Boolean).join(','),
              },
            })
          }
          offset += run.text.length
        }
      }
    }
  }

  return requests
}

/**
 * Parse HTML string into an array of structured blocks.
 * Each block is: { type: 'p'|'h1'|'h2'|'h3'|'list'|'table', text, runs, ... }
 */
function parseHtmlBlocks(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild
  const blocks = []

  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) blocks.push({ type: 'p', text, runs: [{ text, bold: false, italic: false, underline: false }] })
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue

    const tag = node.tagName.toLowerCase()

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const runs = extractRuns(node)
      const text = runs.map(r => r.text).join('')
      blocks.push({ type: tag, text, runs })
    } else if (tag === 'p') {
      const runs = extractRuns(node)
      const text = runs.map(r => r.text).join('')
      if (text.trim()) blocks.push({ type: 'p', text, runs })
    } else if (tag === 'ul' || tag === 'ol') {
      const items = []
      for (const li of node.querySelectorAll('li')) {
        const runs = extractRuns(li)
        const text = runs.map(r => r.text).join('')
        items.push({ text, runs })
      }
      if (items.length) blocks.push({ type: 'list', ordered: tag === 'ol', items })
    } else if (tag === 'table') {
      const rows = []
      for (const tr of node.querySelectorAll('tr')) {
        const cells = []
        for (const cell of tr.querySelectorAll('td, th')) {
          cells.push(cell.textContent.trim())
        }
        rows.push(cells)
      }
      if (rows.length) blocks.push({ type: 'table', rows })
    }
  }

  return blocks
}

/**
 * Extract inline text runs with formatting from an element.
 * Returns: [{ text, bold, italic, underline }]
 */
function extractRuns(element) {
  const runs = []

  function walk(node, inheritBold, inheritItalic, inheritUnderline) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      if (text) {
        runs.push({ text, bold: inheritBold, italic: inheritItalic, underline: inheritUnderline })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const tag = node.tagName.toLowerCase()
    let bold = inheritBold
    let italic = inheritItalic
    let underline = inheritUnderline

    if (tag === 'strong' || tag === 'b') bold = true
    if (tag === 'em' || tag === 'i') italic = true
    if (tag === 'u') underline = true

    for (const child of node.childNodes) {
      walk(child, bold, italic, underline)
    }
  }

  walk(element, false, false, false)
  return runs
}
