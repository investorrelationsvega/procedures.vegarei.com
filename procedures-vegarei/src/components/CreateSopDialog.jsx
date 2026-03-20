import { useState } from 'react'
import { CATEGORIES } from '../lib/drive'

const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([key, val]) => ({
  value: key,
  label: val.label,
  color: val.color,
}))

export default function CreateSopDialog({ company, onSave, onCancel, loading }) {
  const [title, setTitle] = useState('')
  const [sopId, setSopId] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value)
  const [owner, setOwner] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-black w-[480px] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#27474D]">
            New SOP
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* SOP ID */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              SOP ID
            </label>
            <input
              autoFocus
              type="text"
              value={sopId}
              onChange={e => setSopId(e.target.value.toUpperCase())}
              placeholder="e.g. OPS-SOP-001"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-black"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lease Renewal Process"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border transition-colors text-left ${
                    category === opt.value
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 text-gray-600 hover:border-black'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: category === opt.value ? '#fff' : opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#566F69] mb-2">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="e.g. Dan Smith"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans focus:outline-none focus:border-black"
            />
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
            onClick={() => onSave({ sopId: sopId.trim(), title: title.trim(), category, owner: owner.trim(), company })}
            disabled={loading || !sopId.trim() || !title.trim()}
            className="text-xs font-mono px-4 py-2 bg-black text-white hover:bg-[#27474D] transition-colors disabled:opacity-40"
          >
            {loading ? 'Creating…' : 'Create SOP'}
          </button>
        </div>
      </div>
    </div>
  )
}
