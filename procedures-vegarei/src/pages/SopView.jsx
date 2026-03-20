import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useAuth } from '../lib/auth'
import {
  loadSopHtml, loadSopMeta, loadIndex,
  saveSopHtml, saveSopMeta, updateIndex,
  bumpVersion, CATEGORIES,
} from '../lib/drive'
import { MOCK_INDEX } from '../lib/mockData'
import EditorToolbar from '../components/EditorToolbar'
import HistoryPanel from '../components/HistoryPanel'
import SaveDialog from '../components/SaveDialog'

export default function SopView() {
  const { id } = useParams()
  const { token, user, isAuthed } = useAuth()
  const navigate = useNavigate()

  const [sopEntry, setSopEntry]     = useState(null)
  const [html, setHtml]             = useState('')
  const [meta, setMeta]             = useState(null)
  const [index, setIndex]           = useState(null)
  const [editing, setEditing]       = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-editor sop-document px-8 py-8 focus:outline-none' },
    },
  })

  // Load SOP data
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let idx = MOCK_INDEX
        if (import.meta.env.VITE_DRIVE_INDEX_FILE_ID && token) {
          idx = await loadIndex(token)
        }
        setIndex(idx)
        const entry = idx.sops.find(s => s.id === id)
        if (!entry) { setError('SOP not found.'); setLoading(false); return }
        setSopEntry(entry)

        if (entry.htmlFileId && token) {
          const [h, m] = await Promise.all([
            loadSopHtml(entry.htmlFileId, token),
            entry.metaFileId ? loadSopMeta(entry.metaFileId, token) : Promise.resolve(null),
          ])
          setHtml(h)
          setMeta(m)
        } else {
          setHtml(`<p style="font-family:Inter,sans-serif;color:#566F69;font-size:14px;">
            This SOP file is not yet linked to a Google Drive source.<br/>
            Sign in and connect Drive to load and edit the full document.
          </p>`)
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load SOP. Check your Drive connection.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, token])

  // Sync HTML to editor when entering edit mode
  useEffect(() => {
    if (editing && editor && html) {
      editor.commands.setContent(html)
    }
  }, [editing, editor])

  const handleSave = useCallback(async ({ summary, versionType }) => {
    if (!sopEntry || !token) return
    setSaving(true)
    try {
      const newVersion = bumpVersion(sopEntry.version, versionType)
      const updatedHtml = editor.getHTML()

      const newRevision = {
        version: newVersion,
        date: new Date().toISOString().split('T')[0],
        author: user?.name || user?.email || 'Unknown User',
        summary,
        htmlSnapshot: updatedHtml,
      }

      const updatedMeta = {
        ...(meta || { id: sopEntry.id }),
        currentVersion: newVersion,
        revisions: [newRevision, ...(meta?.revisions || [])],
      }

      await Promise.all([
        saveSopHtml(sopEntry.htmlFileId, updatedHtml, token),
        saveSopMeta(sopEntry.metaFileId, updatedMeta, token),
      ])

      const updatedIndex = await updateIndex(index, sopEntry.id, newVersion,
        new Date().toISOString().split('T')[0], token)

      setHtml(updatedHtml)
      setMeta(updatedMeta)
      setIndex(updatedIndex)
      setSopEntry(prev => ({ ...prev, version: newVersion, lastReviewed: newRevision.date }))
      setEditing(false)
      setShowSaveDialog(false)
    } catch (err) {
      console.error(err)
      alert('Save failed. Check Drive permissions and try again.')
    } finally {
      setSaving(false)
    }
  }, [sopEntry, token, editor, meta, index, user])

  const handleRestore = useCallback(async (rev) => {
    if (!confirm(`Restore v${rev.version}? This will create a new revision.`)) return
    editor.commands.setContent(rev.htmlSnapshot)
    setShowHistory(false)
    setEditing(true)
  }, [editor])

  const cat = sopEntry ? CATEGORIES[sopEntry.category] : null

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb + action bar */}
      <div className="border-b border-gray-200 bg-white sticky top-14 z-20">
        <div className="max-w-screen-xl mx-auto px-8 h-12 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#797469]">
            <Link to="/" className="hover:text-black transition-colors">Procedures</Link>
            <span>›</span>
            {cat && (
              <>
                <span style={{ color: cat.color }}>{cat.label}</span>
                <span>›</span>
              </>
            )}
            <span className="text-black font-bold">{id}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {sopEntry && (
              <span className="font-mono text-[10px] text-[#566F69]">
                v{sopEntry.version} · {sopEntry.lastReviewed}
              </span>
            )}

            {meta && (
              <button
                onClick={() => setShowHistory(true)}
                className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
              >
                History
              </button>
            )}

            {isAuthed && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-mono bg-black text-white px-3 py-1.5 hover:bg-[#27474D] transition-colors"
              >
                Edit
              </button>
            )}

            {editing && (
              <>
                <button
                  onClick={() => { setEditing(false) }}
                  className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="text-xs font-mono bg-black text-white px-3 py-1.5 hover:bg-[#27474D] transition-colors"
                >
                  Save revision
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit toolbar */}
      {editing && <EditorToolbar editor={editor} />}

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-8 py-10">
        <div className="max-w-3xl">
          {loading && (
            <p className="font-mono text-sm text-[#566F69]">Loading…</p>
          )}

          {error && (
            <div className="bg-[#fffbeb] border-l-4 border-[#f5c542] px-4 py-3 text-sm text-[#92400e] mb-6">
              {error}
            </div>
          )}

          {/* Category accent line */}
          {cat && !loading && (
            <div className="h-0.5 mb-8" style={{ background: cat.color }} />
          )}

          {/* Document */}
          {!loading && !editing && (
            <div
              className="sop-document"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {!loading && editing && (
            <div className="border border-gray-200">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {showHistory && (
        <HistoryPanel
          meta={meta}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      )}

      {showSaveDialog && (
        <SaveDialog
          onSave={handleSave}
          onCancel={() => setShowSaveDialog(false)}
          loading={saving}
        />
      )}
    </div>
  )
}
