import { useAuth } from '../lib/auth'

const mono = { fontFamily: "'Space Mono', monospace" }

const loadingBarKeyframes = `
@keyframes loadingProgress {
  0% { width: 0%; }
  20% { width: 25%; }
  50% { width: 60%; }
  80% { width: 85%; }
  100% { width: 95%; }
}
@keyframes loadingPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`

const VegaLogo = () => (
  <svg viewBox="0 0 366 576" style={{ width: 48, height: 75, fill: '#a0a0a0', marginBottom: 24, opacity: 0.4, display: 'block', margin: '0 auto 24px' }}>
    <path d="M182.77,0c-8.8,61.66-27.56,110.27-51.34,133.09,23.79,22.82,42.54,71.43,51.34,133.09,8.8-61.66,27.56-110.27,51.34-133.09-23.79-22.82-42.54-71.43-51.34-133.09Z" />
    <path d="M0,133.09h64.04l115.63,361.8h1.24l123.09-361.8h61.54l-157.28,442.62h-60.3L0,133.09Z" />
  </svg>
)

export default function AuthGate({ children }) {
  const { isAuthed, loading, login, user, logout } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <style>{loadingBarKeyframes}</style>
        <div className="grid-bg" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <VegaLogo />
          <div style={{ ...mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#27474D', marginTop: 8, animation: 'loadingPulse 2s ease-in-out infinite' }}>
            Signing in…
          </div>
          <div style={{ width: 200, height: 2, background: 'rgba(0,0,0,0.08)', borderRadius: 1, margin: '20px auto 0', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: '#27474D',
              borderRadius: 1,
              animation: 'loadingProgress 8s ease-out forwards',
            }} />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div className="grid-bg" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <VegaLogo />

          <div style={{ ...mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#27474D', marginBottom: 12 }}>
            Vega Companies
          </div>

          <h1 style={{ ...mono, fontSize: 28, fontWeight: 400, color: '#000000', margin: '0 0 40px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Procedures
          </h1>

          <button
            onClick={() => login()}
            style={{
              ...mono,
              fontSize: 12,
              fontWeight: 700,
              padding: '12px 32px',
              border: '1px solid #000000',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.03)',
              color: '#000000',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '0 auto',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = '#000000' }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div style={{ ...mono, fontSize: 10, color: '#a0a0a0', marginTop: 24 }}>
            Restricted to @vegarei.com accounts
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* User bar in top-right of shell */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 60,
      }}>
        <span style={{ ...mono, fontSize: 10, color: '#a0a0a0' }}>{user?.email}</span>
        <button
          onClick={logout}
          style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000000', border: '1px solid #000000', padding: '4px 12px', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000000' }}
        >
          Sign out
        </button>
      </div>
      {children}
    </>
  )
}
