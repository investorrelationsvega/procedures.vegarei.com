/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        vega: {
          black:      '#000000',
          night:      '#27474D',
          meteorite:  '#566F69',
          spacegrey:  '#797469',
          galaxy:     '#3F4B2A',
          neptune:    '#6A8F78',
          moon:       '#FDF6E5',
          white:      '#FFFFFF',
        },
        cat: {
          legal:      '#f5c542',
          investor:   '#00d4ff',
          compliance: '#f97316',
          tax:        '#22c55e',
          operations: '#a855f7',
          marketing:  '#ec4899',
          technology: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}
