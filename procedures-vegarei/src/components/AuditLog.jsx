import { useState, useEffect } from 'react'

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
            Version History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {loading && <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading revisions…</p>}
        {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

        {!loading && !error && revisions.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>No revisions found.</p>
        )}

        {!loading && !error && revisions.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>Modified</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>User</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((rev, i) => (
                <tr
                  key={rev.id}
                  style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                >
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>
                    {revisions.length - i}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>
                    {new Date(rev.modifiedTime).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1a1a2e' }}>
                    {rev.lastModifyingUser?.displayName || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                    {rev.lastModifyingUser?.emailAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
