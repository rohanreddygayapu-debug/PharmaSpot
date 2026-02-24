import React, { useState } from 'react'
import './PaymentModal.css'

function PaymentModal({ isOpen, onClose, total, items, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [processing, setProcessing] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const calculateChange = () => {
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - total)
  }

  const handlePayment = async () => {
    const received = parseFloat(amountReceived) || 0
    if (paymentMethod === 'cash' && received < total) {
      alert(`Amount received ($${received.toFixed(2)}) is less than total ($${total.toFixed(2)})`)
      return
    }

    // Validate customer information
    if (!customerName.trim()) {
      alert('Please enter customer name')
      return
    }

    setProcessing(true)
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const paymentData = {
        items: items.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0,
          total: item.price * item.quantity
        })),
        subtotal: total,
        total: total,
        payment: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
        change: paymentMethod === 'cash' ? calculateChange() : 0,
        paymentMethod: paymentMethod,
        status: 'completed',
        customerInfo: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim()
        }
      }

      onPaymentSuccess(paymentData)
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-header">
          <h2>💳 Payment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="payment-body">
          <div className="customer-info-section" style={{ order: -1 }}>
            <h3>Customer Information</h3>
            <div className="customer-inputs">
              <div className="input-group">
                <label>Customer Name: *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number (optional)"
                />
              </div>
              <div className="input-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter email (optional)"
                />
              </div>
            </div>
          </div>

          <div className="payment-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {items.map((item, index) => (
                <div key={index} className="summary-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <strong>Total Amount:</strong>
              <strong className="total-amount">${total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Payment Method</h3>
            <div className="method-options">
              <button
                className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                💵 Cash
              </button>
              <button
                className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Card
              </button>
              <button
                className={`method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mobile')}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="cash-payment">
              <div className="input-group">
                <label>Amount Received:</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min={total}
                />
              </div>
              {amountReceived && (
                <div className="change-display">
                  <label>Change:</label>
                  <span className="change-amount">${calculateChange().toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {(paymentMethod === 'card' || paymentMethod === 'mobile') && (
            <div className="digital-payment">
              <div className="payment-info">
                <p>✓ {paymentMethod === 'card' ? 'Card payment terminal ready' : 'Mobile payment ready'}</p>
                <p className="info-text">Click "Complete Payment" to process ${total.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="payment-footer">
          <button className="btn-cancel-payment" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button 
            className="btn-complete-payment" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
