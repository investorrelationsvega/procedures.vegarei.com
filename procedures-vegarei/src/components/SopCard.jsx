import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/drive'

const STATUS_STYLES = {
  active:  { bg: '#f0fdf4', text: '#166534', label: 'Active' },
  draft:   { bg: '#f9fafb', text: '#6b7280', label: 'Draft' },
  review:  { bg: '#fffbeb', text: '#92400e', label: 'Needs Review' },
}

function isOverdue(lastReviewed) {
  const last = new Date(lastReviewed)
  const now = new Date()
  const diffDays = (now - last) / (1000 * 60 * 60 * 24)
  return diffDays > 92 // ~1 quarter
}

export default function SopCard({ sop }) {
  const cat = CATEGORIES[sop.category] || { color: '#000', label: sop.category }
  const overdue = isOverdue(sop.lastReviewed)
  const statusKey = overdue ? 'review' : (sop.status || 'active')
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.active

  return (
    <Link
      to={`/sop/${sop.id}`}
      className="block border border-gray-200 bg-white hover:border-black transition-colors group no-underline"
    >
      {/* Category bar */}
      <div className="h-0.5 w-full" style={{ background: cat.color }} />

      <div className="p-5">
        {/* SOP ID + status */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#566F69]">
            {sop.id}
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-sans text-sm font-semibold text-black mb-3 group-hover:underline leading-snug">
          {sop.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[11px] text-[#797469] font-mono">
          <span>v{sop.version}</span>
          <span>·</span>
          <span>Reviewed {sop.lastReviewed}</span>
          {sop.owner && (
            <>
              <span>·</span>
              <span>{sop.owner}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
