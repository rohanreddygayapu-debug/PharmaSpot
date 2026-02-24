import React, { createContext, useState, useContext, useEffect } from 'react'
import { getApiUrl } from '../utils/config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await fetch(`${getApiUrl()}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const userData = await response.json()
        
        // Check if OTP verification is required
        if (userData.otpRequired === true) {
          return { 
            success: false, 
            otpRequired: true,
            userId: userData.userId,
            email: userData.email,
            message: userData.message || 'OTP sent to your email'
          }
        }
        
        // Check if authentication was successful (direct login, no OTP)
        if (userData.auth === true) {
          setUser(userData)
          setIsAuthenticated(true)
          localStorage.setItem('user', JSON.stringify(userData))
          return { success: true }
        } else {
          return { success: false, error: userData.message || 'Invalid credentials' }
        }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Unable to connect to server. Please check your connection and try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${getApiUrl()}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          role: userData.role || 'user', // Use provided role or default to 'user'
        }),
      })

      if (response.ok) {
        const newUser = await response.json()
        return { success: true, user: newUser }
      } else {
        const error = await response.json()
        return { success: false, error: error.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Unable to connect to server. Please check your connection and try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
  }

  const completeLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
    loading,
    completeLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
