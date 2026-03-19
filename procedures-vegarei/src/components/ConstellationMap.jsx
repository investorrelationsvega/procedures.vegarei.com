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

// Wider viewBox (1400x780) with more padding so labels don't clip
const NODES = [
  { x: 200,  y: 220, align: 'end',    dx: -16, dy: 5 },    // Assisted Living
  { x: 450,  y: 120, align: 'middle', dx: 0,   dy: -16 },  // Builders
  { x: 950,  y: 120, align: 'middle', dx: 0,   dy: -16 },  // Capital Markets
  { x: 1200, y: 220, align: 'start',  dx: 16,  dy: 5 },    // Development
  { x: 180,  y: 560, align: 'end',    dx: -16, dy: 5 },    // Private Equity
  { x: 450,  y: 670, align: 'middle', dx: 0,   dy: 22 },   // Property Management
  { x: 950,  y: 670, align: 'middle', dx: 0,   dy: 22 },   // Real Estate Brokerage
  { x: 1220, y: 560, align: 'start',  dx: 16,  dy: 5 },    // Valuations
]

const CX = 700
const CY = 380

// V icon with 4-pointed star, traced from the Vega brand mark
function VegaIcon({ x, y, scale = 0.45 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) translate(-80, -110)`}>
      {/* 4-pointed star */}
      <path
        d="M80 0 Q90 30 94 42 Q90 54 80 72 Q70 54 66 42 Q70 30 80 0Z"
        fill="#3D3D3D"
      />
      {/* V shape */}
      <path
        d="M8 48 L66 48 Q70 54 76 64 L80 72 Q84 64 90 54 Q94 48 94 48 L152 48 L88 210 Q84 218 80 218 Q76 218 72 210 Z"
        fill="#3D3D3D"
      />
    </g>
  )
}

export default function ConstellationMap() {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 1400 780"
      className="w-full h-auto"
      style={{ maxWidth: 1400, minHeight: 500 }}
    >
      {/* Lines from center to each node */}
      {NODES.map((n, i) => (
        <line
          key={`l-${i}`}
          x1={CX} y1={CY} x2={n.x} y2={n.y}
          stroke="#d4d4d4" strokeWidth="0.75"
        />
      ))}

      {/* Center V icon */}
      <VegaIcon x={CX} y={CY} scale={0.5} />

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
            <circle cx={n.x} cy={n.y} r="5" fill="none" stroke="#999" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="3" fill="#999" />
            <text
              x={n.x + n.dx} y={n.y + n.dy}
              textAnchor={n.align}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                fontWeight: 400,
                fill: '#3D3D3D',
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
