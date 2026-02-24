import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DoctorDetailsForm from './pages/DoctorDetailsForm'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { getApiUrl } from './utils/config'
import './App.css'

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'doctor') {
      checkDoctorProfile()
    }
  }, [isAuthenticated, user])

  const checkDoctorProfile = async () => {
    try {
      setCheckingProfile(true)
      const response = await fetch(`${getApiUrl()}/doctors/user/${user._id}`)
      if (!response.ok) {
        // No profile found, show form
        setShowDoctorForm(true)
      } else {
        setShowDoctorForm(false)
      }
    } catch (error) {
      console.error('Error checking doctor profile:', error)
      setShowDoctorForm(true)
    } finally {
      setCheckingProfile(false)
    }
  }

  if (!isAuthenticated) {
    return <Login />
  }

  if (checkingProfile) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (showDoctorForm && user?.role === 'doctor') {
    return (
      <div className="app">
        <DoctorDetailsForm 
          userId={user._id} 
          onComplete={() => {
            setShowDoctorForm(false)
            checkDoctorProfile()
          }} 
        />
      </div>
    )
  }

  const dashboard = (
    <div className="app">
      <Dashboard />
    </div>
  )

  // Only admins should initialize real-time notifications/socket connection
  if (user?.role === 'admin') {
    return (
      <NotificationProvider>
        {dashboard}
      </NotificationProvider>
    )
  }

  return dashboard
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
