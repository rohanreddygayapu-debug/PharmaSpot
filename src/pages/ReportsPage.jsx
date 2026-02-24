import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import './Dashboard.css'

function ReportsPage() {
  const [transactions, setTransactions] = useState([])
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    cashSales: 0,
    cardSales: 0,
    mobileSales: 0
  })

  useEffect(() => {
    fetchTransactions()
  }, [dateRange])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/transactions/all`)
      if (response.ok) {
        const data = await response.json()
        
        // Filter by date range and status
        const filtered = data.filter(t => {
          if (t.status !== 'completed') return false
          const tDate = new Date(t.createdAt || t.date).toISOString().split('T')[0]
          return tDate >= dateRange.start && tDate <= dateRange.end
        })
        
        setTransactions(filtered)
        
        // Calculate summary
        const totalSales = filtered.reduce((sum, t) => sum + (t.total || 0), 0)
        const totalTransactions = filtered.length
        const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0
        
        const cashSales = filtered.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + (t.total || 0), 0)
        const cardSales = filtered.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + (t.total || 0), 0)
        const mobileSales = filtered.filter(t => t.paymentMethod === 'mobile').reduce((sum, t) => sum + (t.total || 0), 0)
        
        setSummary({
          totalSales,
          totalTransactions,
          averageTransaction,
          cashSales,
          cardSales,
          mobileSales
        })
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Sales Reports</h1>
        <p>View and analyze sales data</p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Date Range</h2>
        </div>
        <div className="action-buttons">
          <div className="input-group" style={{ flex: 1 }}>
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
            />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card revenue">
          <h3>Total Sales</h3>
          <p className="stat-value">${summary.totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-card profit">
          <h3>Transactions</h3>
          <p className="stat-value">{summary.totalTransactions}</p>
        </div>
        <div className="stat-card warning">
          <h3>Average Sale</h3>
          <p className="stat-value">${summary.averageTransaction.toFixed(2)}</p>
        </div>
      </div>

      <div className="tab-content">
        <div className="section">
          <h2>Payment Methods Summary</h2>
          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <h3>💵 Cash</h3>
              <p className="stat-value">${summary.cashSales.toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>💳 Card</h3>
              <p className="stat-value">${summary.cardSales.toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>📱 Mobile</h3>
              <p className="stat-value">${summary.mobileSales.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <h2>Recent Transactions</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Payment Method</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{new Date(transaction.createdAt || transaction.date).toLocaleString()}</td>
                    <td>{transaction.transactionId || transaction._id.slice(-8)}</td>
                    <td>
                      {transaction.paymentMethod === 'cash' && '💵 Cash'}
                      {transaction.paymentMethod === 'card' && '💳 Card'}
                      {transaction.paymentMethod === 'mobile' && '📱 Mobile'}
                    </td>
                    <td>{transaction.items?.length || 0}</td>
                    <td>${(transaction.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${transaction.status === 'completed' ? 'success' : 'warning'}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No transactions found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
