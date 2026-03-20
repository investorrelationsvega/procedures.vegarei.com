import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/drive'

const mono = { fontFamily: "'Space Mono', monospace" }

const STATUS_STYLES = {
  active:  { dot: '#22c55e', label: 'Active' },
  draft:   { dot: '#797469', label: 'Draft' },
  review:  { dot: '#f5c542', label: 'Needs Review' },
}

function getReviewStatus(lastReviewed) {
  const last = new Date(lastReviewed)
  const now = new Date()
  const diffDays = (now - last) / (1000 * 60 * 60 * 24)
  if (diffDays > 92) return 'overdue'      // > 1 quarter
  if (diffDays > 75) return 'due-soon'     // within ~2 weeks of quarter
  return 'on-track'
}

function daysAgo(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

export default function SopCard({ sop }) {
  const cat = CATEGORIES[sop.category] || { color: '#000', label: sop.category }
  const reviewStatus = getReviewStatus(sop.lastReviewed)
  const overdue = reviewStatus === 'overdue'
  const statusKey = overdue ? 'review' : (sop.status || 'active')
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.active
  const days = daysAgo(sop.lastReviewed)

  return (
    <Link
      to={`/sop/${sop.id}`}
      className="group block no-underline"
      style={{
        border: `1px solid ${overdue ? 'rgba(245,197,66,0.4)' : 'rgba(0,0,0,0.08)'}`,
        background: overdue ? 'rgba(255,251,235,0.5)' : '#fff',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#27474D'
        e.currentTarget.style.background = 'rgba(39,71,77,0.02)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = overdue ? 'rgba(245,197,66,0.4)' : 'rgba(0,0,0,0.08)'
        e.currentTarget.style.background = overdue ? 'rgba(255,251,235,0.5)' : '#fff'
      }}
    >
      {/* Category accent */}
      <div className="h-[2px]" style={{ background: cat.color }} />

      <div className="px-4 py-3.5">
        {/* Top row: ID + status */}
        <div className="flex items-center justify-between mb-1.5">
          <span style={mono} className="text-[10px] font-bold tracking-widest text-[#566F69] uppercase">
            {sop.id}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-[5px] h-[5px] rounded-full"
              style={{ background: status.dot }}
            />
            <span style={mono} className="text-[9px] text-[#797469] uppercase tracking-wider">
              {status.label}
            </span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-semibold text-black leading-snug mb-2.5 group-hover:text-[#27474D] transition-colors">
          {sop.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5" style={mono}>
            <span className="text-[10px] text-[#797469]">v{sop.version}</span>
            {sop.owner && (
              <>
                <span className="text-[10px] text-gray-300">&middot;</span>
                <span className="text-[10px] text-[#797469]">{sop.owner}</span>
              </>
            )}
          </div>

          {/* Review indicator */}
          <span
            style={mono}
            className={`text-[9px] uppercase tracking-wider ${
              reviewStatus === 'overdue'
                ? 'text-[#f5c542]'
                : reviewStatus === 'due-soon'
                  ? 'text-[#f97316]'
                  : 'text-[#797469]'
            }`}
          >
            {days}d ago
          </span>
        </div>
      </div>
    </Link>
  )
}
