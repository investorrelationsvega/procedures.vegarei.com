import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function Nav() {
  const { user, login, logout, isAuthed } = useAuth()

  return (
    <nav style={{ background: '#ffffff', borderBottom: '1px solid #000000' }} className="sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-8 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <span style={{ ...mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#000000' }}>
            Vega
          </span>
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
