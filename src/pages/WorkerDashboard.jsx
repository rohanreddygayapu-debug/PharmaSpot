import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/config'
import POSView from '../components/POSView'
import './Dashboard.css'

function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState('pos')
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [expiryAlerts, setExpiryAlerts] = useState([])
  const [paymentMethods] = useState(['cash', 'card', 'insurance', 'mobile'])
  const { user } = useAuth()

  useEffect(() => {
    loadWorkerData()
  }, [])

  const loadWorkerData = async () => {
    try {
      // Load products (read-only)
      const productsRes = await fetch(`${getApiUrl()}/inventory/products`)
      const productsData = await productsRes.json()
      setProducts(productsData)

      // Load transactions
      const transactionsRes = await fetch(`${getApiUrl()}/transactions/all`)
      const transactionsData = await transactionsRes.json()
      setTransactions(transactionsData.slice(0, 10))

      // Load expiry alerts
      const expiryRes = await fetch(`${getApiUrl()}/expiry/alerts`)
      const expiryData = await expiryRes.json()
      setExpiryAlerts(expiryData.slice(0, 5))
    } catch (error) {
      console.error('Error loading worker data:', error)
    }
  }

  return (
    <div className="worker-dashboard">
      <div className="dashboard-header">
        <h1>Worker Dashboard</h1>
        <p>Welcome, {user?.fullname || user?.username}</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'pos' ? 'active' : ''}
          onClick={() => setActiveTab('pos')}
        >
          Point of Sale
        </button>
        <button 
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          View Inventory
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={activeTab === 'expiry' ? 'active' : ''}
          onClick={() => setActiveTab('expiry')}
        >
          Expiry Alerts
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'pos' && (
          <div className="pos-tab">
            <h2>Point of Sale</h2>
            <POSView />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-tab">
            <div className="section-header">
              <h2>Inventory View (Read Only)</h2>
              <p className="info-text">You can view inventory but cannot modify it</p>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.sku || 'N/A'}</td>
                      <td>{product.category || 'N/A'}</td>
                      <td>{product.stock}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>
                        {product.stock === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.stock < (product.minStock || 10) ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <h2>Recent Transactions</h2>
            <div className="payment-methods-section">
              <h3>Supported Payment Methods</h3>
              <div className="payment-methods-grid">
                {paymentMethods.map(method => (
                  <div key={method} className="payment-method-card">
                    <span className="payment-icon">
                      {method === 'cash' && '💵'}
                      {method === 'card' && '💳'}
                      {method === 'insurance' && '🏥'}
                      {method === 'mobile' && '📱'}
                    </span>
                    <span className="payment-name">{method.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction._id}>
                      <td>{transaction.transactionId || transaction._id.slice(-8)}</td>
                      <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      <td>{transaction.items?.length || 0}</td>
                      <td>${transaction.total?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className="payment-badge">{transaction.paymentMethod || 'cash'}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${transaction.status}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div className="expiry-tab">
            <div className="section-header">
              <h2>Expiry Alerts (FEFO Priority)</h2>
              <p className="info-text">Dispense products in order of expiry date</p>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Product</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Stock</th>
                    <th>Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {expiryAlerts.map(alert => (
                    <tr key={alert._id} className={alert.alertLevel === 'critical' ? 'critical-row' : ''}>
                      <td>#{alert.fefoRank}</td>
                      <td>{alert.productName}</td>
                      <td>{new Date(alert.expiryDate).toLocaleDateString()}</td>
                      <td>{alert.daysUntilExpiry} days</td>
                      <td>{alert.quantity}</td>
                      <td>
                        <span className={`badge badge-${alert.alertLevel}`}>
                          {alert.alertLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkerDashboard
