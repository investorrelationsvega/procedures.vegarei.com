import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function Nav() {
  const { user, login, logout, isAuthed } = useAuth()

  return (
    <nav style={{ background: '#ffffff', borderBottom: '1px solid #000000' }} className="sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-8 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          {/* Vega logo mark */}
          <svg viewBox="0 0 366 576" style={{ width: 14, height: 22, fill: '#000000', flexShrink: 0 }}>
            <path d="M182.77,0c-8.8,61.66-27.56,110.27-51.34,133.09,23.79,22.82,42.54,71.43,51.34,133.09,8.8-61.66,27.56-110.27,51.34-133.09-23.79-22.82-42.54-71.43-51.34-133.09Z" />
            <path d="M0,133.09h64.04l115.63,361.8h1.24l123.09-361.8h61.54l-157.28,442.62h-60.3L0,133.09Z" />
          </svg>
          <span style={{ color: '#d0d0d0', fontSize: 14 }}>|</span>
          <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a0a0a0' }}>
            Procedures
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {isAuthed ? (
            <>
              <span className="flex items-center gap-1.5">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27474D', display: 'inline-block' }} />
                <span style={{ ...mono, fontSize: 10, color: '#a0a0a0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Online</span>
              </span>
              <span style={{ ...mono, fontSize: 10, color: '#a0a0a0' }}>{user?.email}</span>
              <button
                onClick={logout}
                style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000000', border: '1px solid #000000', padding: '4px 12px', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000000' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => login()}
              style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000000', border: '1px solid #000000', padding: '4px 12px', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000000' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
