import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getApiUrl } from '../utils/config'
import ChatPage from './ChatPage'
import AppointmentBooking from './AppointmentBooking'
import { LineChart, BarChart, DoughnutChart } from '../components/Charts'
import '../components/Charts.css'
import './CustomerDashboard.css'

function CustomerDashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [activeView, setActiveView] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
  const [customerAccount, setCustomerAccount] = useState(null)
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [chartData, setChartData] = useState({
    spendingOverTime: null,
    purchaseFrequency: null,
    topPurchases: null
  })
  const [chartPeriod, setChartPeriod] = useState('30days')

  const [filter, setFilter] = useState({
    status: 'all',
    dateRange: '30days',
    searchTerm: '',
  })

  useEffect(() => {
    if (user?._id) {
      fetchCustomerAccount()
      fetchTransactions()
      fetchDoctors()
      fetchPrescriptions()
      fetchTwoFactorStatus()
    }
  }, [filter.status, filter.dateRange, user])

  useEffect(() => {
    if (transactions.length > 0) {
      loadChartData()
    }
  }, [chartPeriod, transactions])

  const loadChartData = () => {
    try {
      // Calculate date range based on period
      const endDate = new Date()
      const startDate = new Date()
      
      switch (chartPeriod) {
        case '7days':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30days':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90days':
          startDate.setDate(startDate.getDate() - 90)
          break
        default:
          startDate.setDate(startDate.getDate() - 30)
      }

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => {
        const txDate = new Date(t.createdAt || t.date)
        return txDate >= startDate && txDate <= endDate && t.status === 'completed'
      })

      // Prepare spending over time data
      const spendingByDay = {}
      filteredTransactions.forEach(t => {
        const date = new Date(t.createdAt || t.date).toISOString().split('T')[0]
        spendingByDay[date] = (spendingByDay[date] || 0) + (t.total || 0)
      })

      const sortedDates = Object.keys(spendingByDay).sort((a, b) => new Date(a) - new Date(b))
      
      setChartData(prev => ({
        ...prev,
        spendingOverTime: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Spending ($)',
              data: sortedDates.map(date => spendingByDay[date]),
              borderColor: 'rgb(139, 92, 246)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
      }))

      // Prepare purchase frequency (count by day)
      const purchasesByDay = {}
      filteredTransactions.forEach(t => {
        const date = new Date(t.createdAt || t.date).toISOString().split('T')[0]
        purchasesByDay[date] = (purchasesByDay[date] || 0) + 1
      })

      setChartData(prev => ({
        ...prev,
        purchaseFrequency: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Purchases',
              data: sortedDates.map(date => purchasesByDay[date] || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
            },
          ],
        },
      }))

      // Prepare top purchased items
      const itemPurchases = {}
      filteredTransactions.forEach(t => {
        if (t.items && Array.isArray(t.items)) {
          t.items.forEach(item => {
            const itemName = item.name || 'Unknown'
            const quantity = item.quantity || 0
            itemPurchases[itemName] = (itemPurchases[itemName] || 0) + quantity
          })
        }
      })

      const sortedItems = Object.entries(itemPurchases)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      setChartData(prev => ({
        ...prev,
        topPurchases: {
          labels: sortedItems.map(item => item[0]),
          datasets: [
            {
              label: 'Quantity Purchased',
              data: sortedItems.map(item => item[1]),
              backgroundColor: [
                'rgba(139, 92, 246, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(236, 72, 153, 0.8)',
              ],
              borderColor: [
                'rgb(139, 92, 246)',
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(251, 146, 60)',
                'rgb(236, 72, 153)',
              ],
              borderWidth: 1,
            },
          ],
        },
      }))
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  const fetchCustomerAccount = async () => {
    try {
      setLoadingAccount(true)
      // Normalize user's full name for consistent matching
      const userFullName = user.fullName || user.fullname || ''
      
      // Check if customer account exists by searching for user's email or phone
      // In a production environment, this should use a dedicated API endpoint
      // that accepts search parameters to filter customers server-side
      const response = await fetch(`${getApiUrl()}/customers`)
      
      if (response.ok) {
        const customers = await response.json()
        // Try to find customer by email, phone, or name match
        // Using normalized field names for consistent matching
        const matchedCustomer = customers.find(c => {
          const customerName = c.name || ''
          return (
            (user.email && c.email === user.email) ||
            (user.phone && c.phone === user.phone) ||
            (userFullName && customerName.toLowerCase() === userFullName.toLowerCase())
          )
        })
        setCustomerAccount(matchedCustomer || null)
      }
    } catch (error) {
      console.error('Error fetching customer account:', error)
    } finally {
      setLoadingAccount(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Note: In production, this should include proper authentication headers
      // For now, we're relying on the user object stored in localStorage
      const response = await fetch(
        `${getApiUrl()}/transactions/customer/${user._id}`
      )

      if (response.ok) {
        const data = await response.json()
        setTransactions(data || [])
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true)
      const response = await fetch(`${getApiUrl()}/doctors/verified`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data || [])
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoadingDoctors(false)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true)
      // Note: In production, this should include user authentication and filter by user ID
      // For now, fetching all prescriptions - should be filtered server-side by user
      const response = await fetch(`${getApiUrl()}/prescriptions`)
      if (response.ok) {
        const data = await response.json()
        // Filter prescriptions by current user's patient ID if available
        const userPrescriptions = user?.patientId 
          ? data.filter(p => p.patientID === user.patientId)
          : []
        setPrescriptions(userPrescriptions || [])
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const fetchTwoFactorStatus = async () => {
    try {
      if (user && user._id) {
        const response = await fetch(`${getApiUrl()}/users/user/${user._id}`)
        if (response.ok) {
          const userData = await response.json()
          setTwoFactorEnabled(userData.twoFactorEnabled || false)
        }
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  const handleToggleTwoFactor = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/users/toggle-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          enabled: !twoFactorEnabled
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFactorEnabled(data.twoFactorEnabled)
        alert(data.message)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update two-factor authentication')
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error)
      alert('Failed to update two-factor authentication')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const calculateStats = () => {
    const totalSpent = transactions.reduce((s, t) => s + (t.total || 0), 0)
    const totalTransactions = transactions.length
    const totalItems = transactions.reduce(
      (s, t) => s + (t.items?.length || 0),
      0
    )
    return { totalSpent, totalTransactions, totalItems }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    if (filter.status !== 'all') {
      filtered = filtered.filter(t => t.status === filter.status)
    }

    if (filter.dateRange !== 'all') {
      const days =
        filter.dateRange === 'today'
          ? 1
          : filter.dateRange === '7days'
          ? 7
          : filter.dateRange === '30days'
          ? 30
          : 0

      if (days > 0) {
        const cutoff = new Date(Date.now() - days * 86400000)
        filtered = filtered.filter(
          t => new Date(t.createdAt || t.date) >= cutoff
        )
      }
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase()
      filtered = filtered.filter(
        t =>
          (t.transactionId || '').toLowerCase().includes(term) ||
          t.items?.some(i => i.name?.toLowerCase().includes(term))
      )
    }

    return filtered
  }

  const stats = calculateStats()
  const filteredTransactions = filterTransactions()

  return (
    <div className="customer-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-text">PharmaAI</span>
          </div>

          <div className="header-right">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">
                  {user?.fullName || user?.username}
                </span>
                <span className="user-role">Customer</span>
              </div>
              <button className="logout-btn" onClick={logout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => setActiveView('home')}
        >
          <span className="material-symbols-outlined">home</span>
          Home
        </button>

        <button
          className={`nav-tab ${
            activeView === 'transactions' ? 'active' : ''
          }`}
          onClick={() => setActiveView('transactions')}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          Transactions
        </button>

        <button
          className={`nav-tab ${
            activeView === 'appointments' ? 'active' : ''
          }`}
          onClick={() => setActiveView('appointments')}
        >
          <span className="material-symbols-outlined">calendar_today</span>
          Book Appointment
        </button>

        <button
          className={`nav-tab ${
            activeView === 'doctors' ? 'active' : ''
          }`}
          onClick={() => setActiveView('doctors')}
        >
          <span className="material-symbols-outlined">medical_services</span>
          Available Doctors
        </button>

        <button
          className={`nav-tab ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveView('chat')}
        >
          <span className="material-symbols-outlined">chat</span>
          Messages
        </button>

        <button
          className={`nav-tab ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveView('profile')}
        >
          <span className="material-symbols-outlined">person</span>
          Profile
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {activeView === 'appointments' && <AppointmentBooking />}
        {activeView === 'chat' && <ChatPage />}

        {activeView === 'transactions' && (
          <div className="transactions-view">
            <div className="transactions-header">
              <h2>My Transactions & Medical Bills</h2>
              <p>View your pharmacy purchases and medical prescriptions</p>
            </div>

            {/* FILTERS */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Search by transaction ID or item name..."
                value={filter.searchTerm}
                onChange={e =>
                  setFilter({ ...filter, searchTerm: e.target.value })
                }
                className="search-input"
              />

              <select
                value={filter.status}
                onChange={e =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filter.dateRange}
                onChange={e =>
                  setFilter({ ...filter, dateRange: e.target.value })
                }
                className="filter-select"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* TRANSACTION CARDS */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">receipt_long</span>
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="transactions-grid">
                {filteredTransactions.map(tx => (
                  <div
                    key={tx._id}
                    className="transaction-card"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <div className="transaction-card-header">
                      <div className="transaction-id">
                        <span className="material-symbols-outlined">receipt</span>
                        <span>#{tx.transactionId || tx._id.slice(-8)}</span>
                      </div>
                      <span className={`status-badge ${tx.status}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="transaction-card-body">
                      <div className="transaction-info">
                        <p className="transaction-date">
                          <span className="material-symbols-outlined">calendar_today</span>
                          {new Date(tx.createdAt || tx.date).toLocaleDateString()}
                        </p>
                        <p className="transaction-items">
                          {tx.items?.length || 0} item(s)
                        </p>
                      </div>
                      <div className="transaction-amount">
                        <span className="amount-label">Total</span>
                        <span className="amount-value">${(tx.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="transaction-card-footer">
                      <span className="payment-method">
                        <span className="material-symbols-outlined">
                          {tx.paymentMethod === 'cash' ? 'payments' : 'credit_card'}
                        </span>
                        {tx.paymentMethod || 'cash'}
                      </span>
                      <button className="view-details-btn">
                        View Details
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PRESCRIPTIONS SECTION */}
            <div className="prescriptions-section">
              <h3>Medical Prescriptions</h3>
              {loadingPrescriptions ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading prescriptions...</p>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">medication</span>
                  <p>No prescriptions found</p>
                </div>
              ) : (
                <div className="prescriptions-grid">
                  {prescriptions.map(prescription => (
                    <div key={prescription._id} className="prescription-card">
                      <div className="prescription-header">
                        <span className="material-symbols-outlined">medication</span>
                        <div>
                          <h4>Prescription #{prescription._id.slice(-8)}</h4>
                          <p>Patient ID: {prescription.patientID}</p>
                        </div>
                      </div>
                      <div className="prescription-details">
                        <p><strong>Drug Code:</strong> {prescription.NDC}</p>
                        <p><strong>Quantity:</strong> {prescription.qty}</p>
                        <p><strong>Days:</strong> {prescription.days}</p>
                        <p><strong>Refills:</strong> {prescription.refills}</p>
                        <p><strong>Status:</strong> {prescription.status}</p>
                      </div>
                      <div className="prescription-date">
                        <span className="material-symbols-outlined">schedule</span>
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'doctors' && (
          <div className="doctors-view">
            <h2>Available Doctors</h2>
            {loadingDoctors ? (
              <p>Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p>No doctors available at the moment.</p>
            ) : (
              <div className="doctors-grid">
                {doctors.map(doctor => (
                  <div key={doctor._id} className="doctor-card">
                    <div className="doctor-header">
                      <span className="material-symbols-outlined">medical_services</span>
                      <h3>{doctor.name}</h3>
                    </div>
                    <p><strong>Specialization:</strong> {doctor.specialization}</p>
                    <p><strong>Qualification:</strong> {doctor.qualification}</p>
                    <p><strong>Experience:</strong> {doctor.experience} years</p>
                    <p><strong>Fee:</strong> ${doctor.consultationFee}</p>
                    {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}
                    <button 
                      className="book-btn"
                      onClick={() => setActiveView('appointments')}
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'profile' && (
          <div className="profile-view">
            <h2>My Profile</h2>
            <div className="profile-card">
              <div className="profile-item">
                <strong>Username:</strong> {user?.username}
              </div>
              <div className="profile-item">
                <strong>Full Name:</strong> {user?.fullName || user?.fullname || 'Not provided'}
              </div>
              <div className="profile-item">
                <strong>Email:</strong> {user?.email || 'Not provided'}
              </div>
              <div className="profile-item">
                <strong>Role:</strong> {user?.role || 'User'}
              </div>
            </div>

            <div className="profile-card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Security Settings</h3>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--bg-secondary, #f9fafb)', 
                borderRadius: '8px', 
                border: '1px solid #e0e0e0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>Two-Factor Authentication</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Add an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                    {user && !user.email && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>
                        ⚠️ Email address is required to enable two-factor authentication.
                      </p>
                    )}
                  </div>
                  <div style={{ marginLeft: '2rem' }}>
                    <label style={{ 
                      position: 'relative', 
                      display: 'inline-block', 
                      width: '60px', 
                      height: '34px',
                      cursor: user && !user.email ? 'not-allowed' : 'pointer',
                      opacity: user && !user.email ? 0.5 : 1
                    }}>
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={handleToggleTwoFactor}
                        disabled={twoFactorLoading || (user && !user.email)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: user && !user.email ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: twoFactorEnabled ? '#10b981' : '#ccc',
                        transition: '0.4s',
                        borderRadius: '34px',
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '26px',
                          width: '26px',
                          left: twoFactorEnabled ? '30px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.4s',
                          borderRadius: '50%',
                        }}></span>
                      </span>
                    </label>
                    <div style={{ 
                      marginTop: '0.5rem', 
                      textAlign: 'center', 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      color: twoFactorEnabled ? '#10b981' : '#6b7280' 
                    }}>
                      {twoFactorLoading ? 'Loading...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'home' && (
          <>
            {/* CUSTOMER ACCOUNT INFO */}
            {customerAccount && (
              <div className="customer-account-banner">
                <div className="account-banner-content">
                  <span className="material-symbols-outlined">account_circle</span>
                  <div className="account-info">
                    <h3>Welcome back, {customerAccount.name}!</h3>
                    <p>Customer Account Active • Member since {new Date(customerAccount.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="account-stats-mini">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{stats.totalTransactions}</span>
                    <span className="mini-stat-label">Purchases</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">${stats.totalSpent.toFixed(2)}</span>
                    <span className="mini-stat-label">Total Spent</span>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS CHARTS */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Purchase Analytics</h2>
                <div className="chart-filters">
                  <button 
                    className={`chart-filter-btn ${chartPeriod === '7days' ? 'active' : ''}`}
                    onClick={() => setChartPeriod('7days')}
                  >
                    7 Days
                  </button>
                  <button 
                    className={`chart-filter-btn ${chartPeriod === '30days' ? 'active' : ''}`}
                    onClick={() => setChartPeriod('30days')}
                  >
                    30 Days
                  </button>
                  <button 
                    className={`chart-filter-btn ${chartPeriod === '90days' ? 'active' : ''}`}
                    onClick={() => setChartPeriod('90days')}
                  >
                    90 Days
                  </button>
                </div>
              </div>
              
              <div className="charts-grid">
                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Spending Over Time</h3>
                      <p className="chart-subtitle">Your spending trend</p>
                    </div>
                  </div>
                  {chartData.spendingOverTime ? (
                    <LineChart data={chartData.spendingOverTime} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Purchase Frequency</h3>
                      <p className="chart-subtitle">Number of purchases per day</p>
                    </div>
                  </div>
                  {chartData.purchaseFrequency ? (
                    <BarChart data={chartData.purchaseFrequency} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Top 5 Purchased Items</h3>
                      <p className="chart-subtitle">Your most bought products</p>
                    </div>
                  </div>
                  {chartData.topPurchases ? (
                    <DoughnutChart data={chartData.topPurchases} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-icon-wrapper">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </div>
                <div className="stat-content">
                  <h3>Total Purchases</h3>
                  <p className="stat-number">{stats.totalTransactions}</p>
                  <span className="stat-trend">All time transactions</span>
                </div>
              </div>

              <div className="stat-card stat-success">
                <div className="stat-icon-wrapper">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="stat-content">
                  <h3>Total Spent</h3>
                  <p className="stat-number">${stats.totalSpent.toFixed(2)}</p>
                  <span className="stat-trend">All time spending</span>
                </div>
              </div>

              <div className="stat-card stat-info">
                <div className="stat-icon-wrapper">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <div className="stat-content">
                  <h3>Items Purchased</h3>
                  <p className="stat-number">{stats.totalItems}</p>
                  <span className="stat-trend">Total items bought</span>
                </div>
              </div>
            </div>

            {/* FILTERS */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Search transactions..."
                value={filter.searchTerm}
                onChange={e =>
                  setFilter({ ...filter, searchTerm: e.target.value })
                }
              />

              <select
                value={filter.status}
                onChange={e =>
                  setFilter({ ...filter, status: e.target.value })
                }
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filter.dateRange}
                onChange={e =>
                  setFilter({ ...filter, dateRange: e.target.value })
                }
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* TRANSACTIONS */}
            {loading ? (
              <p>Loading transactions...</p>
            ) : filteredTransactions.length === 0 ? (
              <p>No transactions found</p>
            ) : (
              <div className="transactions-table">
                {filteredTransactions.map(tx => (
                  <div
                    key={tx._id}
                    className="transaction-row"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <span>
                      #{tx.transactionId || tx._id.slice(-6)}
                    </span>
                    <span>${(tx.total || 0).toFixed(2)}</span>
                    <span>{tx.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL - TRANSACTION DETAILS */}
      {selectedTransaction && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="transaction-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Transaction Details</h3>
              <button 
                className="close-btn" 
                onClick={() => setSelectedTransaction(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transaction-info-section">
                <div className="info-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">#{selectedTransaction.transactionId || selectedTransaction._id.slice(-8)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(selectedTransaction.createdAt || selectedTransaction.date).toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className={`value status-badge ${selectedTransaction.status}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Payment Method:</span>
                  <span className="value">{selectedTransaction.paymentMethod || 'cash'}</span>
                </div>
              </div>

              <div className="items-section">
                <h4>Items</h4>
                <div className="items-table">
                  <div className="items-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {selectedTransaction.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">{item.quantity}</span>
                      <span className="item-price">${(item.price || 0).toFixed(2)}</span>
                      <span className="item-total">${(item.total || item.price * item.quantity || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="billing-section">
                <div className="billing-row">
                  <span className="label">Subtotal:</span>
                  <span className="value">${(selectedTransaction.subtotal || 0).toFixed(2)}</span>
                </div>
                {selectedTransaction.tax > 0 && (
                  <div className="billing-row">
                    <span className="label">Tax:</span>
                    <span className="value">${(selectedTransaction.tax || 0).toFixed(2)}</span>
                  </div>
                )}
                {selectedTransaction.discount > 0 && (
                  <div className="billing-row discount">
                    <span className="label">Discount:</span>
                    <span className="value">-${(selectedTransaction.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="billing-row total">
                  <span className="label">Total:</span>
                  <span className="value">${(selectedTransaction.total || 0).toFixed(2)}</span>
                </div>
                {selectedTransaction.payment > 0 && (
                  <>
                    <div className="billing-row">
                      <span className="label">Payment:</span>
                      <span className="value">${(selectedTransaction.payment || 0).toFixed(2)}</span>
                    </div>
                    <div className="billing-row">
                      <span className="label">Change:</span>
                      <span className="value">${(selectedTransaction.change || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedTransaction.customerInfo && (
                <div className="customer-section">
                  <h4>Customer Information</h4>
                  <div className="customer-info">
                    {selectedTransaction.customerInfo.name && (
                      <p><strong>Name:</strong> {selectedTransaction.customerInfo.name}</p>
                    )}
                    {selectedTransaction.customerInfo.phone && (
                      <p><strong>Phone:</strong> {selectedTransaction.customerInfo.phone}</p>
                    )}
                    {selectedTransaction.customerInfo.email && (
                      <p><strong>Email:</strong> {selectedTransaction.customerInfo.email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="print-btn"
                onClick={() => {
                  // Note: For better print functionality, consider implementing a dedicated print view
                  // or using a library like react-to-print that can isolate specific components
                  window.print()
                }}
              >
                <span className="material-symbols-outlined">print</span>
                Print Receipt
              </button>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDashboard
