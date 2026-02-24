import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/config'
import BookingSuccess from './BookingSuccess'
import './AppointmentBooking.css'

function AppointmentBooking() {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [showBooking, setShowBooking] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [user])

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e) => {
      if (showBooking) {
        setShowBooking(false)
      } else if (showSuccess) {
        setShowSuccess(false)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [showBooking, showSuccess])

  // Push history state only when transitioning to booking or success view
  useEffect(() => {
    if (showBooking || showSuccess) {
      window.history.pushState({ 
        page: showBooking ? 'booking' : 'success' 
      }, '', window.location.href)
    }
  }, [showBooking, showSuccess])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load verified doctors
      const doctorsRes = await fetch(`${getApiUrl()}/doctors/verified`)
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json()
        setDoctors(doctorsData)
      }

      // Load user's appointments
      const appointmentsRes = await fetch(`${getApiUrl()}/appointments/user/${user._id}`)
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor)
    setShowBooking(true)
    setFormData({
      patientName: user.fullname || '',
      patientPhone: '',
      patientEmail: user.email || '',
      appointmentDate: '',
      appointmentTime: '',
      reason: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.patientName || !formData.patientPhone || !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${getApiUrl()}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          doctorId: typeof selectedDoctor.userId === 'object' ? selectedDoctor.userId._id : selectedDoctor.userId,
          consultationFee: selectedDoctor.consultationFee || 0,
          ...formData
        }),
      })

      if (response.ok) {
        // Show success page instead of alert
        setSuccessData({
          doctorName: selectedDoctor.name,
          date: new Date(formData.appointmentDate).toLocaleDateString(),
          time: formData.appointmentTime,
          patientName: formData.patientName
        })
        setShowSuccess(true)
        setShowBooking(false)
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      setError('Failed to book appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const response = await fetch(`${getApiUrl()}/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelledBy: user._id,
          cancellationReason: 'Cancelled by patient'
        }),
      })

      if (response.ok) {
        // Removed alert, just reload data
        loadData()
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      setError('Failed to cancel appointment')
    }
  }

  if (loading) {
    return (
      <div className="appointment-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <BookingSuccess 
        appointment={successData}
        onClose={() => {
          setShowSuccess(false)
          setSuccessData(null)
        }}
      />
    )
  }

  if (showBooking) {
    return (
      <div className="appointment-booking-page">
        <div className="booking-form-container">
          <button className="back-button" onClick={() => setShowBooking(false)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>

          <div className="booking-header">
            <h1>Book Appointment</h1>
            <div className="selected-doctor">
              <span className="material-symbols-outlined">medical_services</span>
              <div>
                <h3>{selectedDoctor.name}</h3>
                <p>{selectedDoctor.specialization}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-grid">
              <label className="form-group">
                <span className="form-label">Patient Name *</span>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </label>

              <label className="form-group">
                <span className="form-label">Phone Number *</span>
                <input
                  type="tel"
                  name="patientPhone"
                  value={formData.patientPhone}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </label>

              <label className="form-group">
                <span className="form-label">Email</span>
                <input
                  type="email"
                  name="patientEmail"
                  value={formData.patientEmail}
                  onChange={handleChange}
                  className="form-input"
                />
              </label>

              <label className="form-group">
                <span className="form-label">Appointment Date *</span>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  required
                />
              </label>

              <label className="form-group">
                <span className="form-label">Appointment Time *</span>
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </label>

              <label className="form-group full-width">
                <span className="form-label">Reason for Visit</span>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                />
              </label>
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Booking...</span>
                </>
              ) : (
                'Book Appointment'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="appointment-booking-page">
      <div className="page-header">
        <h1>Book an Appointment</h1>
        <p>Schedule a consultation with our verified doctors</p>
      </div>

      <div className="appointments-section">
        <h2>My Appointments</h2>
        {appointments.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">event_busy</span>
            <p>No appointments scheduled</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map(apt => (
              <div key={apt._id} className="appointment-card">
                <div className="appointment-header">
                  <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                  <div className="appointment-date">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                    <span>{apt.appointmentTime}</span>
                  </div>
                </div>
                <div className="appointment-details">
                  <h3>Dr. {apt.doctorId?.fullname || 'Unknown'}</h3>
                  <p><strong>Patient:</strong> {apt.patientName}</p>
                  <p><strong>Reason:</strong> {apt.reason || 'Not specified'}</p>
                </div>
                {apt.status === 'pending' && (
                  <button className="cancel-button" onClick={() => cancelAppointment(apt._id)}>
                    Cancel Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="doctors-section">
        <h2>Available Doctors</h2>
        {doctors.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">medical_services</span>
            <p>No doctors available</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-avatar">
                  <span className="material-symbols-outlined">medical_services</span>
                </div>
                <div className="doctor-info">
                  <h3>{doctor.name}</h3>
                  <p className="specialization">{doctor.specialization}</p>
                  <p className="qualification">{doctor.qualification}</p>
                  <p className="experience">{doctor.experience} years experience</p>
                  {doctor.consultationFee > 0 && (
                    <p className="fee">Fee: ${doctor.consultationFee}</p>
                  )}
                </div>
                <button className="book-button" onClick={() => handleBookAppointment(doctor)}>
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentBooking
