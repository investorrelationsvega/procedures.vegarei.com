import { useNavigate } from 'react-router-dom'

const COMPANIES = [
  { slug: 'assisted-living',       label: 'Assisted Living' },
  { slug: 'builders',              label: 'Builders' },
  { slug: 'capital-markets',       label: 'Capital Markets' },
  { slug: 'development',           label: 'Development' },
  { slug: 'private-equity',        label: 'Private Equity' },
  { slug: 'property-management',   label: 'Property Management' },
  { slug: 'real-estate-brokerage', label: 'Real Estate Brokerage' },
  { slug: 'valuations',            label: 'Valuations' },
]

// Positions matching the vegarei.com star layout (viewBox 1200x720)
const NODES = [
  { x: 130,  y: 195, align: 'end',    dx: -16, dy: 5 },
  { x: 370,  y: 115, align: 'middle', dx: 0,   dy: -16 },
  { x: 830,  y: 115, align: 'middle', dx: 0,   dy: -16 },
  { x: 1070, y: 195, align: 'start',  dx: 16,  dy: 5 },
  { x: 110,  y: 520, align: 'end',    dx: -16, dy: 5 },
  { x: 370,  y: 630, align: 'middle', dx: 0,   dy: 22 },
  { x: 830,  y: 630, align: 'middle', dx: 0,   dy: 22 },
  { x: 1090, y: 520, align: 'start',  dx: 16,  dy: 5 },
]

const CX = 600
const CY = 340

export default function ConstellationMap() {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 1200 720"
      className="w-full h-auto"
      style={{ maxWidth: 1200, minHeight: 480 }}
    >
      {/* Lines from center to each node */}
      {NODES.map((n, i) => (
        <line
          key={`l-${i}`}
          x1={CX} y1={CY} x2={n.x} y2={n.y}
          stroke="#C5C0B4" strokeWidth="0.75"
        />
      ))}

      {/* Center V logo */}
      <g transform={`translate(${CX}, ${CY})`}>
        <polygon points="0,-52 14,-34 0,-16 -14,-34" fill="#3F4B2A" />
        <polygon points="-42,-28 -20,-28 0,38 -22,38" fill="#9A9684" opacity="0.7" />
        <polygon points="42,-28 20,-28 0,38 22,38" fill="#9A9684" opacity="0.55" />
        <polygon points="-10,-10 10,-10 0,38" fill="#B0AC9E" opacity="0.3" />
      </g>

      {/* Company nodes */}
      {COMPANIES.map((co, i) => {
        const n = NODES[i]
        return (
          <g
            key={co.slug}
            className="cursor-pointer"
            onClick={() => navigate(`/${co.slug}`)}
            role="link"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(`/${co.slug}`)}
          >
            <circle cx={n.x} cy={n.y} r="50" fill="transparent" />
            <circle cx={n.x} cy={n.y} r="5" fill="none" stroke="#A8A295" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="3" fill="#A8A295" />
            <text
              x={n.x + n.dx} y={n.y + n.dy}
              textAnchor={n.align}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 400,
                fill: '#6B6860',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
              }}
            >
              {co.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
