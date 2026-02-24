import React, { useState, useEffect, useRef } from 'react'
import { getApiUrl } from '../utils/config'
import './Login.css'

function OTPVerification({ userId, email, onBack, onSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Countdown for block time
    if (blockTimeLeft > 0) {
      const timer = setTimeout(() => {
        setBlockTimeLeft(blockTimeLeft - 1)
        if (blockTimeLeft - 1 === 0) {
          setIsBlocked(false)
          setAttemptsLeft(3)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [blockTimeLeft])

  useEffect(() => {
    // Countdown for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = pastedData.split('')
    while (newOtp.length < 6) newOtp.push('')
    setOtp(newOtp)

    // Focus last filled input or last input
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    if (isBlocked) {
      setError(`Please wait ${blockTimeLeft} seconds before trying again`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/users/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp: otpCode }),
      })

      const data = await response.json()

      if (data.auth === true) {
        // OTP verified successfully
        onSuccess(data)
      } else if (data.blocked) {
        // User is blocked
        setIsBlocked(true)
        setBlockTimeLeft(data.remainingTime || 30)
        setError(data.message)
        setOtp(['', '', '', '', '', ''])
      } else {
        // OTP is invalid
        setError(data.message)
        setAttemptsLeft(data.attemptsLeft || 0)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('Unable to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/users/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.success) {
        setResendCooldown(60) // 60 seconds cooldown
        setAttemptsLeft(3)
        setIsBlocked(false)
        setBlockTimeLeft(0)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        // Show success message briefly
        setError('')
      } else {
        setError(data.message || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('Unable to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const maskedEmail = email
    ? email.length >= 5 && email.includes('@')
      ? email.replace(/(.{2})(.*)(@.*)/, (_, first, middle, domain) => {
          return first + '*'.repeat(Math.min(middle.length, 4)) + domain
        })
      : email.replace(/^(.)(.*?)(@.*)/, (_, first, middle, domain) => {
          return first + '*'.repeat(Math.max(1, middle.length)) + domain
        })
    : '***'

  return (
    <div className="login-container">
      <div className="login-form-column otp-verification-container">
        {/* Back Button */}
        <button className="back-button" onClick={onBack} disabled={loading}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Login
        </button>

        {/* Header / Logo */}
        <header className="login-logo-header">
          <div className="logo-icon">
            <svg className="logo-svg" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <span className="logo-title">PharmaAI</span>
        </header>

        {/* Main Content Area */}
        <main className="login-main-content">
          {/* Page Heading */}
          <div className="login-heading">
            <h1 className="login-title">Verify Your Identity</h1>
            <p className="login-subtitle">
              We've sent a 6-digit verification code to {maskedEmail}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form otp-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {attemptsLeft < 3 && attemptsLeft > 0 && !isBlocked && (
              <div className="warning-message">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
              </div>
            )}

            {isBlocked && (
              <div className="block-message">
                <span className="material-symbols-outlined">timer</span>
                Please wait {blockTimeLeft} seconds
              </div>
            )}

            {/* OTP Input Fields */}
            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="otp-input"
                  disabled={loading || isBlocked}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-button" disabled={loading || isBlocked}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  Verify OTP
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="resend-otp-section">
              <p className="resend-text">Didn't receive the code?</p>
              <button
                type="button"
                className="resend-button"
                onClick={handleResendOTP}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? (
                  <>Resend OTP in {resendCooldown}s</>
                ) : (
                  <>
                    <span className="material-symbols-outlined">refresh</span>
                    Resend OTP
                  </>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Footer */}
        <footer className="login-footer">
          <div className="security-badge">
            <span className="material-symbols-outlined">lock</span>
            <p>Secure OTP verification</p>
          </div>
        </footer>
      </div>

      {/* Right Column: Visual */}
      <div className="login-visual-column">
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <div className="status-badge">
            <div className="status-pulse"></div>
            <span className="status-text">Two-Factor Authentication</span>
          </div>
          <h2 className="visual-title">Enhanced Security</h2>
          <p className="visual-description">
            We've added an extra layer of security to protect your account with OTP verification.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification
