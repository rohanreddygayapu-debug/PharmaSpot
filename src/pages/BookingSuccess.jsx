import React, { useEffect } from 'react'
import './BookingSuccess.css'

function BookingSuccess({ appointment, onClose }) {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="booking-success-page">
      <div className="success-container">
        <div className="success-animation">
          <div className="success-checkmark">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>

        <div className="success-content">
          <h1>Appointment Booked Successfully!</h1>
          <p className="success-message">
            Your appointment has been confirmed. You will receive a confirmation shortly.
          </p>

          {appointment && (
            <div className="appointment-summary">
              <h2>Appointment Details</h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="material-symbols-outlined">medical_services</span>
                  <div>
                    <p className="label">Doctor</p>
                    <p className="value">{appointment.doctorName}</p>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <div>
                    <p className="label">Date</p>
                    <p className="value">{appointment.date}</p>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="material-symbols-outlined">schedule</span>
                  <div>
                    <p className="label">Time</p>
                    <p className="value">{appointment.time}</p>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="material-symbols-outlined">person</span>
                  <div>
                    <p className="label">Patient</p>
                    <p className="value">{appointment.patientName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="success-actions">
            <button className="btn-primary" onClick={onClose}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Appointments
            </button>
          </div>

          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>
                <span className="material-symbols-outlined">notifications</span>
                You'll receive a confirmation email shortly
              </li>
              <li>
                <span className="material-symbols-outlined">check_circle</span>
                The doctor will review and confirm your appointment
              </li>
              <li>
                <span className="material-symbols-outlined">chat</span>
                You can message the doctor if you have any questions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccess
