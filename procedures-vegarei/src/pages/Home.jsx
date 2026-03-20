import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadIndex } from '../lib/drive'
import { checkAndNotifyReviews } from '../lib/reviewNotifier'

const mono = { fontFamily: "'Space Mono', monospace" }

const COMPANIES = [
  { slug: 'assisted-living',       num: '01', label: 'Assisted Living Management', desc: 'Management & Operations' },
  { slug: 'builders',              num: '02', label: 'Builders',                   desc: 'Construction' },
  { slug: 'capital-markets',       num: '03', label: 'Capital Markets',            desc: 'Debt & Equity Financing' },
  { slug: 'development',           num: '04', label: 'Development',                desc: 'Land Development' },
  { slug: 'hospice',               num: '05', label: 'Hospice',                    desc: 'End-of-Life Care' },
  { slug: 'private-equity',        num: '06', label: 'Private Equity',             desc: 'Sales & Fund Administration' },
  { slug: 'property-management',   num: '07', label: 'Property Management & Real Estate', desc: 'Operations & Holdings' },
  { slug: 'valuations',            num: '08', label: 'Valuations',                 desc: 'Appraisal & Advisory' },
  { slug: 'employee-handbook',     num: '09', label: 'Employee Handbook',             desc: 'Policies & Guidelines' },
]

function CompanyCard({ company, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 6,
        padding: '20px 22px',
        background: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 140,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#27474D'; e.currentTarget.style.background = 'rgba(39,71,77,0.03)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.background = '#ffffff' }}
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#27474D', display: 'inline-block' }} />
          <span style={{ ...mono, fontSize: 10, color: '#707070', letterSpacing: '0.05em' }}>{company.num}</span>
        </div>
        <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#000000', marginBottom: 4 }}>{company.label}</div>
        <div style={{ ...mono, fontSize: 11, color: '#707070' }}>{company.desc}</div>
      </div>
      <div style={{ ...mono, fontSize: 11, color: '#27474D', marginTop: 16 }}>
        Enter &rarr;
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { token } = useAuth()

  // Check for overdue SOPs and send email reminders (once per day)
  useEffect(() => {
    if (!token || !import.meta.env.VITE_DRIVE_INDEX_FILE_ID) return
    loadIndex(token)
      .then(index => checkAndNotifyReviews(index, token))
      .catch(() => {}) // silent — notification is best-effort
  }, [token])

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="grid-bg" />

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px', position: 'relative', zIndex: 1 }}>
        {/* V + Star logo */}
        <svg viewBox="0 0 366 576" style={{ width: 40, height: 62, fill: '#707070', display: 'block', margin: '0 auto 24px', opacity: 0.4 }}>
          <path d="M182.77,0c-8.8,61.66-27.56,110.27-51.34,133.09,23.79,22.82,42.54,71.43,51.34,133.09,8.8-61.66,27.56-110.27,51.34-133.09-23.79-22.82-42.54-71.43-51.34-133.09Z" />
          <path d="M0,133.09h64.04l115.63,361.8h1.24l123.09-361.8h61.54l-157.28,442.62h-60.3L0,133.09Z" />
        </svg>

        <div style={{ ...mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#27474D', marginBottom: 12 }}>
          Vega Companies
        </div>

        <h1 style={{ ...mono, fontSize: 32, fontWeight: 400, color: '#000000', margin: '0 0 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Procedures
        </h1>

        <div style={{ ...mono, fontSize: 11, color: '#707070', letterSpacing: '0.05em' }}>
          Performance &nbsp;&loz;&nbsp; Partnership &nbsp;&loz;&nbsp; Prosperity
        </div>
      </div>

      {/* Business Units divider */}
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0 28px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
          <span style={{ ...mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#707070' }}>
            Business Units
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
        </div>
      </div>

      {/* Company grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 32px', flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="home-grid">
          {COMPANIES.map(co => (
            <CompanyCard key={co.slug} company={co} onClick={() => navigate(`/${co.slug}`)} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '40px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ ...mono, fontSize: 10, color: '#707070' }}>
          Vega &copy; {new Date().getFullYear()}
        </span>
        <span style={{ ...mono, fontSize: 10, color: '#707070' }}>
          System Status: Operational
        </span>
      </footer>
    </div>
  )
}
