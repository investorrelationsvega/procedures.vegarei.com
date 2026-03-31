// Parse uploaded documents into plain text for AI reformatting
export async function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'docx' || ext === 'doc') {
    throw new Error('Word document upload is not supported. Please save as .txt or create a Google Doc in Drive and import it from there.')
  }

  if (ext === 'txt' || ext === 'md') {
    return await file.text()
  }

  if (ext === 'pdf') {
    throw new Error('PDF upload is not yet supported. Please paste the content or upload a .txt file.')
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: .txt, .md`)
}
