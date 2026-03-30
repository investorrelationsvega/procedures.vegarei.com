import useGoogleAuth from './useGoogleAuth'

export default function AuthGate({ children }) {
  const { user, signIn, signOut, isAuthenticated } = useGoogleAuth()

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0f1e', fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '48px 40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Logo / title */}
          <div style={{ marginBottom: '32px' }}>
            <img
              src="/vega-icon.svg"
              alt="Vega"
              style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#1a1a2e',
                margin: 0,
              }}
            >
              Vega Procedures
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Sign in to access SOPs
            </p>
          </div>

          <button
            onClick={signIn}
            style={{
              backgroundColor: '#c9a84c',
              color: '#0a0f1e',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Signed-in user bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 50,
        }}
      >
        {user?.picture && (
          <img
            src={user.picture}
            alt=""
            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
          />
        )}
        <span style={{ fontSize: '13px', color: '#ffffff' }}>
          {user?.name}
        </span>
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '4px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  )
}
