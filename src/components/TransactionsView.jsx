import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import { exportToPDF } from '../utils/exportUtils'
import './TransactionsView.css'

function TransactionsView() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: 'all', dateRange: '7days' })
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/transactions/all`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0)
    const totalTransactions = transactions.length
    const totalItems = transactions.reduce((sum, t) => sum + (t.items?.length || 0), 0)

    return { totalSales, totalTransactions, totalItems }
  }

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null
    
    try {
      const response = await fetch(`${getApiUrl()}/customers/customer/${customerId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
    }
    return null
  }

  const handleViewDetails = async (transaction) => {
    setSelectedTransaction(transaction)
    
    // Fetch customer details if customerId exists
    if (transaction.customerId) {
      const customer = await fetchCustomerDetails(transaction.customerId)
      setCustomerDetails(customer)
    } else if (transaction.customerInfo) {
      // Use embedded customer info if available
      setCustomerDetails(transaction.customerInfo)
    } else {
      setCustomerDetails(null)
    }
  }

  const closeModal = () => {
    setSelectedTransaction(null)
    setCustomerDetails(null)
  }

  const downloadTransactions = () => {
    const columns = [
      { key: 'transactionId', label: 'Invoice', render: (val, row) => `#${val || row._id?.slice(-6)}` },
      { key: 'createdAt', label: 'Date', render: (val, row) => new Date(val || row.date).toLocaleDateString() },
      { key: 'total', label: 'Total', render: (val) => `$${val?.toFixed(2) || '0.00'}` },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'status', label: 'Status' }
    ]
    exportToPDF(transactions, columns, 'Transaction History Report', 'transactions-history.pdf')
  }

  const stats = calculateStats()

  return (
    <div className="transactions-view">
      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p className="stat-value">${stats.totalSales.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card stat-primary">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>Transactions</h3>
            <p className="stat-value">{stats.totalTransactions}</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Items Sold</h3>
            <p className="stat-value">{stats.totalItems}</p>
          </div>
        </div>
      </div>

      <div className="transactions-card">
        <div className="transactions-header">
          <h2>Transaction History</h2>
          <div className="transactions-filters">
            <button onClick={downloadTransactions} className="btn-primary" style={{ marginRight: '1rem' }}>
              📥 Download Report
            </button>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>📋 No transactions found</p>
            <p>Transactions will appear here once you make sales</p>
          </div>
        ) : (
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>#{transaction.transactionId || transaction._id?.slice(-6)}</td>
                    <td>{new Date(transaction.createdAt || transaction.date).toLocaleDateString()}</td>
                    <td className="amount">${transaction.total?.toFixed(2)}</td>
                    <td>
                      {transaction.paymentMethod === 'cash' && '💵 Cash'}
                      {transaction.paymentMethod === 'card' && '💳 Card'}
                      {transaction.paymentMethod === 'mobile' && '📱 Mobile'}
                      {!transaction.paymentMethod && 'Cash'}
                    </td>
                    <td>
                      <span className={`status-badge status-${transaction.status === 'completed' ? 'paid' : 'unpaid'}`}>
                        {transaction.status || 'completed'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Customer Information */}
              <div className="details-section">
                <h3>Customer Information</h3>
                {customerDetails ? (
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{customerDetails.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{customerDetails.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{customerDetails.phone || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-customer-info">No customer information available</p>
                )}
              </div>

              {/* Transaction Information */}
              <div className="details-section">
                <h3>Transaction Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Invoice:</span>
                    <span className="detail-value">#{selectedTransaction.transactionId || selectedTransaction._id?.slice(-6)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      {selectedTransaction.paymentMethod === 'cash' && '💵 Cash'}
                      {selectedTransaction.paymentMethod === 'card' && '💳 Card'}
                      {selectedTransaction.paymentMethod === 'mobile' && '📱 Mobile'}
                      {!selectedTransaction.paymentMethod && 'Cash'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="details-section">
                <h3>Items</h3>
                <div className="items-list">
                  {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                    selectedTransaction.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </div>
                        <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-items">No items in this transaction</p>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="details-section total-section">
                <div className="total-row">
                  <span className="total-label">Total Amount:</span>
                  <span className="total-value">${selectedTransaction.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionsView
