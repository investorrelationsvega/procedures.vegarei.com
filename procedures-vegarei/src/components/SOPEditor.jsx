import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchDocContent, saveDocContent } from '../services/docsService'
import { fetchDriveFile, saveSopHtml, exportGoogleDocAsHtml } from '../lib/drive'

const mono = { fontFamily: "'Space Mono', monospace" }

function ToolbarButton({ label, onClick, title, active, style: extraStyle }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 text-xs font-mono border transition-colors ${
        active
          ? 'bg-black text-white border-black'
          : 'border-gray-300 text-gray-700 hover:border-black'
      }`}
      style={extraStyle}
    >
      {label}
    </button>
  )
}

function insertTable() {
  const html = '<table><tr><th>&nbsp;</th><th>&nbsp;</th><th>&nbsp;</th></tr>' +
    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br></p>'
  document.execCommand('insertHTML', false, html)
}

export default function SOPEditor({ docId, title, accessToken, onClose }) {
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [loadedHtml, setLoadedHtml] = useState('')
  const isGoogleDoc = useRef(false)

  // Load content from Drive
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let html
        try {
          html = await exportGoogleDocAsHtml(docId, accessToken)
          isGoogleDoc.current = true
        } catch {
          html = await fetchDriveFile(docId, accessToken)
          isGoogleDoc.current = false
        }
        setLoadedHtml(html)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId, accessToken])

  // Set content on the editor div once it renders
  useEffect(() => {
    if (!loading && editorRef.current && loadedHtml) {
      editorRef.current.innerHTML = loadedHtml
    }
  }, [loading, loadedHtml])

  const handleInput = useCallback(() => {
    setDirty(true)
    setSaved(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const content = editorRef.current.innerHTML
      if (isGoogleDoc.current) {
        await saveDocContent(docId, content, accessToken)
      } else {
        await saveSopHtml(docId, content, accessToken)
      }
      setDirty(false)
      setSaved(true)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [docId, accessToken])

  const handleCancel = useCallback(() => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }, [dirty, onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 px-6 py-3 border-b border-gray-200 bg-gray-50 items-center">
        <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D] mr-4">
          {title || 'Edit SOP'}
        </span>

        <ToolbarButton label="H1" onClick={() => document.execCommand('formatBlock', false, 'h1')} title="Heading 1" />
        <ToolbarButton label="H2" onClick={() => document.execCommand('formatBlock', false, 'h2')} title="Heading 2" />
        <ToolbarButton label="H3" onClick={() => document.execCommand('formatBlock', false, 'h3')} title="Heading 3" />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="B" onClick={() => document.execCommand('bold')} title="Bold" style={{ fontWeight: 700 }} />
        <ToolbarButton label="I" onClick={() => document.execCommand('italic')} title="Italic" style={{ fontStyle: 'italic' }} />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="• List" onClick={() => document.execCommand('insertUnorderedList')} title="Bullet list" />
        <ToolbarButton label="1. List" onClick={() => document.execCommand('insertOrderedList')} title="Numbered list" />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="Table" onClick={insertTable} title="Insert 3×3 table" />

        <div className="w-px bg-gray-300 mx-1 self-stretch" />

        <ToolbarButton label="Undo" onClick={() => document.execCommand('undo')} title="Undo" />
        <ToolbarButton label="Redo" onClick={() => document.execCommand('redo')} title="Redo" />

        <div className="flex-1" />

        {error && (
          <span className="text-xs text-red-600 mr-2">{error}</span>
        )}
        {saved && (
          <span style={mono} className="text-[10px] text-[#22c55e] uppercase tracking-wider mr-2">Saved</span>
        )}
        {saving && (
          <span className="flex items-center gap-2 mr-2">
            <span className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            <span style={mono} className="text-[10px] text-[#797469] uppercase tracking-wider">Saving…</span>
          </span>
        )}

        <button
          onClick={handleCancel}
          className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-8 py-10">
          <div className="max-w-3xl">
            {loading ? (
              <div className="flex items-center gap-3 py-20">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading…</span>
              </div>
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="sop-document focus:outline-none"
                style={{ minHeight: 600 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
