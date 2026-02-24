import React, { useState } from 'react'
import './AppointmentPaymentModal.css'

function AppointmentPaymentModal({ isOpen, onClose, appointment, onPaymentComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)

  const handleComplete = async () => {
    setProcessing(true)
    
    try {
      await onPaymentComplete(paymentMethod)
      onClose()
    } catch (error) {
      console.error('Payment completion error:', error)
      alert('Failed to complete payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="appointment-payment-modal-overlay" onClick={onClose}>
      <div className="appointment-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="appointment-payment-header">
          <h2>💳 Complete Appointment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="appointment-payment-body">
          <div className="appointment-summary">
            <h3>Appointment Details</h3>
            <div className="summary-item">
              <span>Patient:</span>
              <strong>{appointment.patientName}</strong>
            </div>
            <div className="summary-item">
              <span>Date:</span>
              <strong>{new Date(appointment.appointmentDate).toLocaleDateString()}</strong>
            </div>
            <div className="summary-item">
              <span>Time:</span>
              <strong>{appointment.appointmentTime}</strong>
            </div>
            {appointment.consultationFee > 0 && (
              <div className="summary-item total">
                <span>Consultation Fee:</span>
                <strong className="fee-amount">${appointment.consultationFee.toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div className="payment-methods-section">
            <h3>Payment Method</h3>
            <div className="payment-method-options">
              <button
                className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                💵 Cash
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Card
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mobile')}
              >
                📱 Mobile Pay
              </button>
              <button
                className={`payment-method-btn ${paymentMethod === 'insurance' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('insurance')}
              >
                🏥 Insurance
              </button>
            </div>
          </div>
        </div>

        <div className="appointment-payment-footer">
          <button className="btn-cancel-modal" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button 
            className="btn-complete-modal" 
            onClick={handleComplete}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Complete & Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppointmentPaymentModal
