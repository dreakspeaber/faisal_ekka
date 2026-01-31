import { useState, useEffect } from 'react'
import Login from './components/Login'
import FishStoreApp from './FishStoreApp'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem('dc_fish_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    localStorage.setItem('dc_fish_authenticated', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dc_fish_authenticated')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return <FishStoreApp onLogout={handleLogout} />
}

export default App
