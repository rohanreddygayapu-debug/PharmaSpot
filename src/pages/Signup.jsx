import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import loginImage from '../../assets/loginui/image.png'
import './Signup.css'

function Signup({ onSwitchToLogin }) {
  const [userType, setUserType] = useState('user') // 'user' or 'doctor'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const { theme } = useTheme()
  const { register, login } = useAuth()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })

    // Check username availability when username changes
    if (name === 'username' && value.length >= 3) {
      // TODO: Implement actual API call to check username availability
      // For now, showing as available for demo purposes
      setTimeout(() => {
        setUsernameAvailable(true)
      }, 500)
    } else if (name === 'username') {
      setUsernameAvailable(null)
    }
  }

  const calculatePasswordStrength = (password) => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.fullName || !formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (passwordStrength < 2) {
      setError('Password is too weak. Please use a stronger password.')
      return
    }

    setLoading(true)
    
    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: userType,
      })

      if (result.success) {
        // Successfully registered, now auto-login
        const loginResult = await login(formData.username, formData.password)
        if (!loginResult.success) {
          // If auto-login fails, take them to login page
          setError('Registration successful! Please log in with your credentials.')
          setTimeout(() => onSwitchToLogin(), 2000)
        }
        // If login succeeds, AuthContext will handle navigation to appropriate dashboard
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      {/* Left Panel - Visual */}
      <div className="signup-visual">
        <img src={loginImage} alt="Signup UI" className="signup-visual-image" />
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <div className="status-badge">
            <div className="status-dot"></div>
            <span className="status-text">99.9% Accuracy</span>
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div className="testimonial">
            <blockquote>
              <p className="testimonial-text">
                "Optimizing pharmacy workflows with AI-powered inventory management has never been easier."
              </p>
              <footer className="testimonial-footer">
                <div className="testimonial-line"></div>
                <p className="testimonial-author">Join 10,000+ pharmacists</p>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="signup-form-panel">
        <div className="signup-form-container">
          {/* Mobile Header */}
          <div className="signup-mobile-header">
            <div className="logo-icon">
              <svg className="logo-svg" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd"></path>
              </svg>
            </div>
            <span className="logo-text">PharmaAI</span>
          </div>

          {/* Header */}
          <div className="signup-header">
            <h1 className="signup-title">Create your Account</h1>
            <p className="signup-subtitle">Join the future of pharmacy inventory management today.</p>
          </div>

          {/* User Type Selection */}
          <div className="user-type-selection">
            <button
              type="button"
              className={`user-type-btn ${userType === 'user' ? 'active' : ''}`}
              onClick={() => setUserType('user')}
            >
              <span className="material-symbols-outlined">person</span>
              <div>
                <div className="type-title">Patient/User</div>
                <div className="type-desc">Book appointments and chat with doctors</div>
              </div>
            </button>
            <button
              type="button"
              className={`user-type-btn ${userType === 'doctor' ? 'active' : ''}`}
              onClick={() => setUserType('doctor')}
            >
              <span className="material-symbols-outlined">medical_services</span>
              <div>
                <div className="type-title">Doctor</div>
                <div className="type-desc">Provide consultations and manage appointments</div>
              </div>
            </button>
          </div>

          {/* Social Sign Up */}
          <div className="social-buttons">
            <button type="button" className="social-button">
              <svg className="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="social-button">
              <svg className="social-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
                <path d="M1 1h10v10H1z" fill="#f35325"></path>
                <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                <path d="M12 12h10v10H12z" fill="#ffba08"></path>
              </svg>
              <span>Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">Or register with email</span>
            <div className="divider-line"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Full Name */}
            <label className="form-group">
              <span className="form-label">Full Name</span>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input with-icon"
                  disabled={loading}
                />
              </div>
            </label>

            {/* Email */}
            <label className="form-group">
              <span className="form-label">Email Address</span>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="form-input with-icon"
                  disabled={loading}
                />
              </div>
            </label>

            {/* Username */}
            <label className="form-group">
              <span className="form-label">Username</span>
              <div className="input-with-status">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="form-input with-icon"
                  disabled={loading}
                />
                {usernameAvailable && formData.username.length >= 3 && (
                  <div className="input-status">
                    <span className="material-symbols-outlined status-icon-success">check_circle</span>
                  </div>
                )}
              </div>
            </label>

            {/* Password and Confirm Password */}
            <div className="form-row">
              <label className="form-group">
                <span className="form-label">Password</span>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="form-input with-icon"
                    disabled={loading}
                  />
                </div>
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className={`strength-bar ${passwordStrength >= 1 ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${passwordStrength >= 2 ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${passwordStrength >= 3 ? 'active' : ''}`}></div>
                    <div className={`strength-bar ${passwordStrength >= 4 ? 'active' : ''}`}></div>
                  </div>
                )}
              </label>

              <label className="form-group">
                <span className="form-label">Confirm Password</span>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="form-input with-icon"
                    disabled={loading}
                  />
                </div>
              </label>
            </div>

            {/* Terms Checkbox */}
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="checkbox-input"
                disabled={loading}
              />
              <span className="checkbox-label">
                I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>.
              </span>
            </label>

            {/* Submit Button */}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="signup-footer">
            Already a member?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} className="link-primary">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
