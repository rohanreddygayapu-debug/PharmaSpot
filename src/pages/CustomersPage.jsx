import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import { exportToPDF } from '../utils/exportUtils'
import './CustomersPage.css'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/customers/all`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data || [])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer)
    setLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/customers/customer/${customer._id}/purchases`)
      if (response.ok) {
        const data = await response.json()
        setPurchaseHistory(data || [])
      } else {
        setPurchaseHistory([])
      }
    } catch (error) {
      console.error('Error loading purchase history:', error)
      setPurchaseHistory([])
    } finally {
      setLoading(false)
    }
  }

  const closePurchaseHistory = () => {
    setSelectedCustomer(null)
    setPurchaseHistory([])
  }

  const downloadCustomers = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' }
    ]
    exportToPDF(customers, columns, 'Customers Report', 'customers.pdf')
  }

  return (
    <div className="page-container">
      <div className="customers-page">
        <div className="page-header">
          <h1>👥 Customers</h1>
          <button onClick={downloadCustomers} className="btn-primary">
            📥 Download Report
          </button>
        </div>

        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>{customer.address || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-view-history"
                        onClick={() => handleCustomerClick(customer)}
                      >
                        View Purchases
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedCustomer && (
          <div className="purchase-history-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Purchase History - {selectedCustomer.name}</h2>
                <button className="close-btn" onClick={closePurchaseHistory}>✕</button>
              </div>
              <div className="modal-body">
                {loading ? (
                  <p>Loading purchase history...</p>
                ) : purchaseHistory.length === 0 ? (
                  <p>No purchase history found for this customer.</p>
                ) : (
                  <div className="purchase-history-list">
                    {purchaseHistory.map((transaction) => (
                      <div key={transaction._id} className="purchase-card">
                        <div className="purchase-header">
                          <div>
                            <strong>Transaction ID:</strong> {transaction._id.slice(-8)}
                          </div>
                          <div>
                            <strong>Date:</strong> {new Date(transaction.createdAt || transaction.date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Total:</strong> ${transaction.total?.toFixed(2)}
                          </div>
                        </div>
                        <div className="purchase-items">
                          <h4>Items:</h4>
                          <ul>
                            {transaction.items?.map((item, index) => (
                              <li key={index}>
                                {item.name} - Qty: {item.quantity} - ${item.total?.toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="purchase-footer">
                          <span className="payment-method">Payment: {transaction.paymentMethod}</span>
                          <span className={`status-badge ${transaction.status}`}>{transaction.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomersPage
