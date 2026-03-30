import { useState, useEffect } from 'react'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function AuditLog({ sopId, accessToken, onClose }) {
  const [revisions, setRevisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadRevisions() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${sopId}/revisions?fields=revisions(id,modifiedTime,lastModifyingUser)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        if (res.status === 401) {
          throw new Error('Session expired, please sign in again.')
        }
        if (!res.ok) throw new Error(`Failed to load revisions: ${res.status}`)
        const data = await res.json()
        setRevisions(data.revisions || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (sopId && accessToken) loadRevisions()
  }, [sopId, accessToken])

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Panel — matches HistoryPanel.jsx structure */}
      <div className="w-[480px] bg-white border-l border-black flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <span style={mono} className="text-xs font-bold tracking-widest uppercase text-[#27474D]">
            Version History
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-3 p-6">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              <span style={mono} className="text-xs text-[#797469] uppercase tracking-wider">Loading…</span>
            </div>
          )}

          {error && (
            <div className="m-6 bg-[#fffbeb] border-l-4 border-[#f5c542] px-4 py-3 text-sm text-[#92400e]">
              {error}
            </div>
          )}

          {!loading && !error && revisions.length === 0 && (
            <p style={mono} className="text-sm text-gray-400 p-6">No revision history yet.</p>
          )}

          {!loading && !error && revisions.length > 0 && (
            <div className="px-6 py-4">
              <table className="sop-document" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Modified</th>
                    <th>User</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((rev, i) => (
                    <tr key={rev.id}>
                      <td style={mono} className="text-xs font-bold">{revisions.length - i}</td>
                      <td className="text-xs">{new Date(rev.modifiedTime).toLocaleString()}</td>
                      <td className="text-xs">{rev.lastModifyingUser?.displayName || '—'}</td>
                      <td className="text-xs text-[#797469]">{rev.lastModifyingUser?.emailAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
