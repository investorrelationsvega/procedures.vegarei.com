// Vega star shape — the 4-point star from the logo
// Used as a review notification indicator
export default function VegaStar({ size = 20, glowing = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${glowing ? 'vega-star-glow' : ''} ${className}`}
      style={{ flexShrink: 0 }}
    >
      <path
        d="M50 0 C46 35, 35 46, 0 50 C35 54, 46 65, 50 100 C54 65, 65 54, 100 50 C65 46, 54 35, 50 0Z"
        fill={glowing ? '#f5c542' : '#797469'}
      />
    </svg>
  )
}
