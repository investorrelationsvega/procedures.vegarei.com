import { useState } from 'react'

export default function SaveDialog({ onSave, onCancel, loading }) {
  const [summary, setSummary] = useState('')
  const [versionType, setVersionType] = useState('patch')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[440px] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#27474D]">
            Save Revision
          </span>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Revision note */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              What changed?
            </label>
            <input
              autoFocus
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="e.g. Updated attorney contact information"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          {/* Version bump */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              Version bump
            </label>
            <div className="flex gap-2">
              {['patch', 'minor', 'major'].map(type => (
                <button
                  key={type}
                  onClick={() => setVersionType(type)}
                  className={`flex-1 py-2 text-xs font-mono border transition-colors capitalize ${
                    versionType === type
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 text-gray-600 hover:border-black'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#797469] font-mono mt-1.5">
              Patch = typos/contact updates · Minor = process changes · Major = full rewrite
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-xs font-mono px-4 py-2 border border-gray-300 hover:border-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ summary: summary || 'Quarterly review update', versionType })}
            disabled={loading || !summary.trim()}
            className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
          >
            {loading ? 'Saving…' : 'Save revision'}
          </button>
        </div>
      </div>
    </div>
  )
}
