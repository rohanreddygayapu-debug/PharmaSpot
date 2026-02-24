import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './Navbar.css'

function Navbar({ activeView, setActiveView, userRole }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleViewChange = (view) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/assets/images/logo.svg" alt="PharmaSpot" className="navbar-logo" />
          <span className="navbar-title">PharmaSpot</span>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button
            className={`navbar-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => handleViewChange('home')}
          >
            🏠 {userRole === 'admin' ? 'Dashboard' : 'Home'}
          </button>
          {userRole === 'admin' && (
            <>
              <button
                className={`navbar-item ${activeView === 'reports' ? 'active' : ''}`}
                onClick={() => handleViewChange('reports')}
              >
                📊 Reports
              </button>
              <button
                className={`navbar-item ${activeView === 'settings' ? 'active' : ''}`}
                onClick={() => handleViewChange('settings')}
              >
                ⚙️ Settings
              </button>
            </>
          )}
          {(userRole === 'admin' || userRole === 'worker') && (
            <>
              <button
                className={`navbar-item ${activeView === 'pos' ? 'active' : ''}`}
                onClick={() => handleViewChange('pos')}
              >
                🛒 POS
              </button>
              <button
                className={`navbar-item ${activeView === 'transactions' ? 'active' : ''}`}
                onClick={() => handleViewChange('transactions')}
              >
                💳 Transactions
              </button>
            </>
          )}
        </div>

        <div className={`navbar-actions ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button className="theme-toggle-navbar" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <div className="navbar-user">
            <span className="user-icon">👤</span>
            <span className="user-name">{user?.username || 'User'}</span>
          </div>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
