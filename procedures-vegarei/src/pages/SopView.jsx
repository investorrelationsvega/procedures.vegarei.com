import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  loadSopHtml, loadSopMeta, loadIndex,
  updateSopInIndex, CATEGORIES, REVIEW_CADENCES, getReviewStatus, logAuditEvent,
} from '../lib/drive'
import { fetchDocContent } from '../services/docsService'
import { MOCK_INDEX } from '../lib/mockData'
import HistoryPanel from '../components/HistoryPanel'
import SOPEditor from '../components/SOPEditor'
import AuditLog from '../components/AuditLog'
import VegaStar from '../components/VegaStar'

function userName(user) {
  return user?.name || user?.email || 'Unknown User'
}

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
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

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
          // Try loading as Google Doc first, fall back to raw HTML
          let h
          try {
            h = await fetchDocContent(entry.htmlFileId, token)
          } catch {
            h = await loadSopHtml(entry.htmlFileId, token)
          }
          const m = entry.metaFileId ? await loadSopMeta(entry.metaFileId, token) : null
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

  // Called when SOPEditor overlay closes after a save
  const handleEditorClose = useCallback(async () => {
    setEditing(false)
    if (sopEntry?.htmlFileId && token) {
      try {
        let h
        try {
          h = await fetchDocContent(sopEntry.htmlFileId, token)
        } catch {
          h = await loadSopHtml(sopEntry.htmlFileId, token)
        }
        setHtml(h)
      } catch (err) {
        console.error('Failed to refresh content:', err)
      }
    }
  }, [sopEntry, token])

  const handleCompleteReview = useCallback(async () => {
    if (!sopEntry || !token || !index) return
    setSaving(true)
    try {
      const now = new Date().toISOString().split('T')[0]

      const event = {
        action: 'review-completed',
        date: new Date().toISOString(),
        user: userName(user),
        email: user?.email || '',
      }
      const updatedMeta = await logAuditEvent(sopEntry.metaFileId, meta, event, token)

      const updatedIndex = await updateSopInIndex(index, sopEntry.id, {
        lastReviewed: now,
        status: 'active',
      }, token)

      setMeta(updatedMeta)
      setIndex(updatedIndex)
      setSopEntry(prev => ({ ...prev, lastReviewed: now, status: 'active' }))
    } catch (err) {
      console.error(err)
      alert('Failed to complete review. Check Drive permissions.')
    } finally {
      setSaving(false)
    }
  }, [sopEntry, token, index, meta, user])

  const handleArchive = useCallback(async () => {
    if (!sopEntry || !token || !index) return
    if (!confirm(`Archive "${sopEntry.title}"? It will be hidden from the main list but can be restored.`)) return
    setSaving(true)
    try {
      const event = {
        action: 'archived',
        date: new Date().toISOString(),
        user: userName(user),
        email: user?.email || '',
      }
      const updatedMeta = await logAuditEvent(sopEntry.metaFileId, meta, event, token)
      const updatedIndex = await updateSopInIndex(index, sopEntry.id, { status: 'archived' }, token)
      setMeta(updatedMeta)
      setIndex(updatedIndex)
      setSopEntry(prev => ({ ...prev, status: 'archived' }))
    } catch (err) {
      console.error(err)
      alert('Failed to archive. Check Drive permissions.')
    } finally {
      setSaving(false)
    }
  }, [sopEntry, token, index, meta, user])

  const handleRestore = useCallback(async () => {
    if (!sopEntry || !token || !index) return
    setSaving(true)
    try {
      const event = {
        action: 'restored',
        date: new Date().toISOString(),
        user: userName(user),
        email: user?.email || '',
      }
      const updatedMeta = await logAuditEvent(sopEntry.metaFileId, meta, event, token)
      const updatedIndex = await updateSopInIndex(index, sopEntry.id, { status: 'active' }, token)
      setMeta(updatedMeta)
      setIndex(updatedIndex)
      setSopEntry(prev => ({ ...prev, status: 'active' }))
    } catch (err) {
      console.error(err)
      alert('Failed to restore. Check Drive permissions.')
    } finally {
      setSaving(false)
    }
  }, [sopEntry, token, index, meta, user])

  const handlePrint = useCallback(async () => {
    if (sopEntry?.metaFileId && token) {
      const event = {
        action: 'print',
        date: new Date().toISOString(),
        user: userName(user),
        email: user?.email || '',
      }
      const updated = await logAuditEvent(sopEntry.metaFileId, meta, event, token)
      setMeta(updated)
    }
    window.print()
  }, [sopEntry, token, meta, user])

  const handleDownload = useCallback(async () => {
    if (sopEntry?.metaFileId && token) {
      const event = {
        action: 'download',
        date: new Date().toISOString(),
        user: userName(user),
        email: user?.email || '',
      }
      const updated = await logAuditEvent(sopEntry.metaFileId, meta, event, token)
      setMeta(updated)
    }
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${sopEntry?.title || id}</title>
<style>body{font-family:Inter,system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:8px 12px;text-align:left}</style>
</head><body>${html}</body></html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sopEntry?.id || id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [sopEntry, token, meta, user, html, id])

  const cat = sopEntry ? CATEGORIES[sopEntry.category] : null

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb + action bar */}
      <div className="border-b border-gray-200 bg-white sticky top-14 z-20">
        <div className="max-w-screen-xl mx-auto px-8 h-12 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#797469]">
            <Link to="/" className="hover:text-black transition-colors">Procedures</Link>
            <span>&rsaquo;</span>
            {cat && (
              <>
                <span style={{ color: cat.color }}>{cat.label}</span>
                <span>&rsaquo;</span>
              </>
            )}
            <span className="text-black font-bold">{id}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {sopEntry && (
              <span className="font-mono text-[10px] text-[#566F69]">
                v{sopEntry.version} &middot; {sopEntry.lastReviewed}
              </span>
            )}

            {isAuthed && sopEntry && (
              <>
                <button
                  onClick={handlePrint}
                  className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
                >
                  Download
                </button>
              </>
            )}

            {sopEntry?.htmlFileId && isAuthed && (
              <button
                onClick={() => setShowAuditLog(true)}
                className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
              >
                Version History
              </button>
            )}

            {meta && (
              <button
                onClick={() => setShowHistory(true)}
                className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
              >
                History
              </button>
            )}

            {isAuthed && sopEntry?.status !== 'archived' && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-mono bg-black text-white px-3 py-1.5 hover:bg-[#27474D] transition-colors"
              >
                Edit
              </button>
            )}

            {isAuthed && sopEntry && sopEntry.status !== 'archived' && (
              <button
                onClick={handleArchive}
                disabled={saving}
                className="text-xs font-mono border border-gray-300 px-3 py-1.5 hover:border-black transition-colors text-[#797469]"
              >
                Archive
              </button>
            )}

            {isAuthed && sopEntry?.status === 'archived' && (
              <button
                onClick={handleRestore}
                disabled={saving}
                className="text-xs font-mono bg-black text-white px-3 py-1.5 hover:bg-[#27474D] transition-colors"
              >
                Restore
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review notification banner */}
      {sopEntry && (() => {
        const reviewStatus = getReviewStatus(sopEntry.lastReviewed, sopEntry.reviewCadence)
        const cadence = REVIEW_CADENCES[sopEntry.reviewCadence]
        if (reviewStatus === 'on-track' || !cadence) return null
        return (
          <div className={`border-b ${reviewStatus === 'overdue' ? 'bg-[#fffbeb] border-[#f5c542]/30' : 'bg-[#fff7ed] border-[#f97316]/20'}`}>
            <div className="max-w-screen-xl mx-auto px-8 py-2.5 flex items-center gap-3">
              <VegaStar size={16} glowing={reviewStatus === 'overdue'} />
              <span className="text-xs text-[#92400e]">
                {reviewStatus === 'overdue'
                  ? `This SOP is overdue for its ${cadence.label.toLowerCase()} review.`
                  : `This SOP is due for its ${cadence.label.toLowerCase()} review soon.`
                }
              </span>
              {isAuthed && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[10px] font-mono uppercase tracking-wider border border-[#f5c542] text-[#92400e] px-3 py-1 hover:bg-[#f5c542]/20 transition-colors"
                  >
                    Edit & Review
                  </button>
                  <button
                    onClick={handleCompleteReview}
                    disabled={saving}
                    className="text-[10px] font-mono uppercase tracking-wider bg-[#f5c542] text-black px-3 py-1 hover:bg-[#e5b532] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <span className="w-2.5 h-2.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : null}
                    Mark Review Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Archived banner */}
      {sopEntry?.status === 'archived' && (
        <div className="border-b bg-gray-50 border-gray-200">
          <div className="max-w-screen-xl mx-auto px-8 py-2.5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#797469]">
              This SOP has been archived
            </span>
            {isAuthed && (
              <button
                onClick={handleRestore}
                disabled={saving}
                className="ml-auto text-[10px] font-mono uppercase tracking-wider border border-gray-300 text-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
              >
                Restore
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-8 py-10">
        <div className="max-w-3xl">
          {loading && (
            <p className="font-mono text-sm text-[#566F69]">Loading&hellip;</p>
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

          {/* Document (read-only view) */}
          {!loading && (
            <div
              className="sop-document"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>

      {/* SOPEditor full-screen overlay */}
      {editing && sopEntry?.htmlFileId && (
        <SOPEditor
          docId={sopEntry.htmlFileId}
          title={sopEntry.title}
          accessToken={token}
          onClose={handleEditorClose}
        />
      )}

      {/* Drive revisions audit log */}
      {showAuditLog && sopEntry?.htmlFileId && (
        <AuditLog
          sopId={sopEntry.htmlFileId}
          accessToken={token}
          onClose={() => setShowAuditLog(false)}
        />
      )}

      {/* Existing history panel (meta.json revisions) */}
      {showHistory && (
        <HistoryPanel
          meta={meta}
          onClose={() => setShowHistory(false)}
          onRestore={() => {}}
        />
      )}
    </div>
  )
}
