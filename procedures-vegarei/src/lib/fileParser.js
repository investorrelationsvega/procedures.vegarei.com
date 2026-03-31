// Parse uploaded documents into text or HTML content
export async function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'html' || ext === 'htm') {
    const html = await file.text()
    // Extract body content if it's a full HTML document
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    return bodyMatch ? bodyMatch[1].trim() : html.trim()
  }

  if (ext === 'txt' || ext === 'md') {
    return await file.text()
  }

  if (ext === 'docx' || ext === 'doc') {
    throw new Error('Word document upload is not supported. Please save as .html or .txt, or create a Google Doc in Drive.')
  }

  if (ext === 'pdf') {
    throw new Error('PDF upload is not yet supported. Please paste the content or upload an .html or .txt file.')
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: .html, .txt, .md`)
}
