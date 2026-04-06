import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import LoginGate from './components/LoginGate'
import Nav from './components/Nav'
import Home from './pages/Home'
import CompanySops from './pages/CompanySops'
import SopView from './pages/SopView'
import ReviewDashboard from './pages/ReviewDashboard'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LoginGate>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">
              <Routes>
                <Route path="/"           element={<Home />} />

                <Route path="/reviews"    element={<ReviewDashboard />} />
                <Route path="/sop/:id"    element={<SopView />} />
                <Route path="/:company"   element={<CompanySops />} />
              </Routes>
            </main>
          </div>
        </LoginGate>
      </BrowserRouter>
    </AuthProvider>
  )
}
