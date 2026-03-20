import ConstellationMap from '../components/ConstellationMap'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <ConstellationMap />
      </div>
      <footer className="py-5 text-center">
        <p className="text-[10px] tracking-wider uppercase"
           style={{ fontFamily: "'Space Mono', monospace", color: '#999999' }}>
          Vega Companies · procedures.vegarei.com · Confidential
        </p>
      </footer>
    </div>
  )
}
