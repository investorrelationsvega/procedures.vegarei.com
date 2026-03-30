import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchFileContent, saveFileContent } from '../services/driveService'

const TOOLBAR_BUTTONS = [
  { label: 'H1', command: () => document.execCommand('formatBlock', false, 'h1'), title: 'Heading 1' },
  { label: 'H2', command: () => document.execCommand('formatBlock', false, 'h2'), title: 'Heading 2' },
  { label: 'H3', command: () => document.execCommand('formatBlock', false, 'h3'), title: 'Heading 3' },
  { type: 'separator' },
  { label: 'B', command: () => document.execCommand('bold'), title: 'Bold', style: { fontWeight: 700 } },
  { label: 'I', command: () => document.execCommand('italic'), title: 'Italic', style: { fontStyle: 'italic' } },
  { type: 'separator' },
  { label: '• List', command: () => document.execCommand('insertUnorderedList'), title: 'Bullet list' },
  { label: '1. List', command: () => document.execCommand('insertOrderedList'), title: 'Numbered list' },
  { type: 'separator' },
  { label: 'Table', command: 'insertTable', title: 'Insert 3x3 table' },
  { type: 'separator' },
  { label: '↩ Undo', command: () => document.execCommand('undo'), title: 'Undo' },
  { label: '↪ Redo', command: () => document.execCommand('redo'), title: 'Redo' },
]

function insertTable() {
  const rows = 3
  const cols = 3
  let html = '<table style="border-collapse:collapse;width:100%">'
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      const tag = r === 0 ? 'th' : 'td'
      html += `<${tag} style="border:1px solid #d1d5db;padding:8px 12px;text-align:left">&nbsp;</${tag}>`
    }
    html += '</tr>'
  }
  html += '</table><p><br></p>'
  document.execCommand('insertHTML', false, html)
}

export default function SOPEditor({ fileId, title, accessToken, onClose }) {
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const originalHtml = useRef('')

  // Load content on mount
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const html = await fetchFileContent(fileId, accessToken)
        originalHtml.current = html
        if (editorRef.current) {
          editorRef.current.innerHTML = html
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fileId, accessToken])

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
      await saveFileContent(fileId, editorRef.current.innerHTML, accessToken)
      originalHtml.current = editorRef.current.innerHTML
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [fileId, accessToken])

  const handleCancel = useCallback(() => {
    if (dirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    onClose()
  }, [dirty, onClose])

  const handleToolbar = useCallback((btn) => {
    if (btn.command === 'insertTable') {
      insertTable()
    } else if (typeof btn.command === 'function') {
      btn.command()
    }
    editorRef.current?.focus()
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          backgroundColor: '#0a0f1e',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#c9a84c', fontSize: '14px', fontWeight: 600, marginRight: '16px' }}>
          {title || 'Edit SOP'}
        </span>

        {TOOLBAR_BUTTONS.map((btn, i) =>
          btn.type === 'separator' ? (
            <div key={i} style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
          ) : (
            <button
              key={i}
              onClick={() => handleToolbar(btn)}
              title={btn.title}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                ...(btn.style || {}),
              }}
            >
              {btn.label}
            </button>
          )
        )}

        <div style={{ flex: 1 }} />

        {error && (
          <span style={{ color: '#f87171', fontSize: '12px', marginRight: '8px' }}>{error}</span>
        )}
        {saved && (
          <span style={{ color: '#4ade80', fontSize: '12px', marginRight: '8px' }}>Saved</span>
        )}

        <button
          onClick={handleCancel}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#c9a84c',
            border: 'none',
            color: '#0a0f1e',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '32px 16px' }}>
        {loading ? (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading…</p>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              maxWidth: '860px',
              width: '100%',
              padding: '40px 48px',
              minHeight: '600px',
              outline: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#1a1a2e',
            }}
          />
        )}
      </div>

      {/* Editor typography styles */}
      <style>{`
        [contenteditable] h1 { font-size: 28px; font-weight: 700; margin: 24px 0 12px; }
        [contenteditable] h2 { font-size: 22px; font-weight: 600; margin: 20px 0 10px; }
        [contenteditable] h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
        [contenteditable] table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
        [contenteditable] th { background-color: #f3f4f6; font-weight: 600; }
      `}</style>
    </div>
  )
}
