import { useState } from 'react'

export default function HistoryPanel({ meta, onClose, onRestore }) {
  const [preview, setPreview] = useState(null)

  const revisions = meta?.revisions || []
  const auditLog = meta?.auditLog || []

  const [tab, setTab] = useState('revisions')

  const ACTION_LABELS = { print: 'Printed document', download: 'Downloaded document' }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="w-[480px] bg-white border-l border-black flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#27474D]">
            Version History
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl leading-none">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('revisions')}
            className={`flex-1 py-2.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
              tab === 'revisions' ? 'text-black border-b-2 border-black font-bold' : 'text-[#797469] hover:text-black'
            }`}
          >
            Revisions ({revisions.length})
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`flex-1 py-2.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
              tab === 'audit' ? 'text-black border-b-2 border-black font-bold' : 'text-[#797469] hover:text-black'
            }`}
          >
            Audit Trail ({auditLog.length})
          </button>
        </div>

        {/* Revisions list */}
        {tab === 'revisions' && (
          <div className="flex-1 overflow-y-auto">
            {revisions.length === 0 && (
              <p className="text-sm text-gray-400 font-mono p-6">No revision history yet.</p>
            )}
            {revisions.map((rev, i) => (
              <div
                key={i}
                className={`border-b border-gray-100 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  preview === i ? 'bg-[#FDF6E5]' : ''
                }`}
                onClick={() => setPreview(preview === i ? null : i)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-black">v{rev.version}</span>
                      {i === 0 && (
                        <span className="font-mono text-[9px] bg-black text-white px-1.5 py-0.5 tracking-wider uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#566F69] mb-1">{rev.summary}</p>
                    <p className="font-mono text-[10px] text-[#797469]">
                      {rev.date} · {rev.author}
                    </p>
                  </div>
                  {i > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRestore(rev) }}
                      className="text-[10px] font-mono border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors whitespace-nowrap mt-1"
                    >
                      Restore
                    </button>
                  )}
                </div>

                {/* Inline preview */}
                {preview === i && rev.htmlSnapshot && (
                  <div className="mt-4 border border-gray-200 bg-white p-4 max-h-64 overflow-y-auto">
                    <div
                      className="sop-document text-xs"
                      dangerouslySetInnerHTML={{ __html: rev.htmlSnapshot }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Audit trail */}
        {tab === 'audit' && (
          <div className="flex-1 overflow-y-auto">
            {auditLog.length === 0 && (
              <p className="text-sm text-gray-400 font-mono p-6">No audit events yet.</p>
            )}
            {auditLog.map((evt, i) => (
              <div key={i} className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    evt.action === 'print' ? 'bg-[#6366f1]' : evt.action === 'download' ? 'bg-[#22c55e]' : 'bg-[#797469]'
                  }`} />
                  <span className="font-mono text-xs font-bold text-black">
                    {ACTION_LABELS[evt.action] || evt.action}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[#797469]">
                  {new Date(evt.date).toLocaleString()} · {evt.user}
                </p>
                {evt.email && (
                  <p className="font-mono text-[10px] text-[#a0a0a0]">{evt.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
