import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './lib/auth'
import LoginGate from './components/LoginGate'
import Nav from './components/Nav'
import Home from './pages/Home'
import CompanySops from './pages/CompanySops'
import SopView from './pages/SopView'
import StyleGuide from './pages/StyleGuide'
import './styles/global.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <LoginGate>
            <div className="min-h-screen flex flex-col">
              <Nav />
              <main className="flex-1">
                <Routes>
                  <Route path="/"           element={<Home />} />
                  <Route path="/settings/style-guide" element={<StyleGuide />} />
                  <Route path="/sop/:id"    element={<SopView />} />
                  <Route path="/:company"   element={<CompanySops />} />
                </Routes>
              </main>
            </div>
          </LoginGate>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
