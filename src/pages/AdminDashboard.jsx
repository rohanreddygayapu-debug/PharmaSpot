import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/config'
import DoctorVerification from '../components/DoctorVerification'
import NotificationPanel from '../components/NotificationPanel'
import { LineChart, BarChart, DoughnutChart } from '../components/Charts'
import { exportToPDF } from '../utils/exportUtils'
import '../components/Charts.css'
import './Dashboard.css'

function AdminDashboard({ setActiveView }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showManagementSidebar, setShowManagementSidebar] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    lowStock: 0,
    expiringItems: 0,
    totalTransactions: 0
  })
  const [products, setProducts] = useState([])
  const [forecasts, setForecasts] = useState([])
  const [expiryAlerts, setExpiryAlerts] = useState([])
  const [autoReorders, setAutoReorders] = useState([])
  const [chartData, setChartData] = useState({
    revenueOverTime: null,
    salesByCategory: null,
    transactionTrends: null
  })
  const [chartPeriod, setChartPeriod] = useState('7days')
  const [documents, setDocuments] = useState([])
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadType, setUploadType] = useState('general')
  const { user } = useAuth()

  useEffect(() => {
    loadDashboardData()
    loadDocuments()
  }, [])

  useEffect(() => {
    loadChartData()
  }, [chartPeriod])

  const loadChartData = async () => {
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
          startDate.setDate(startDate.getDate() - 7)
      }

      // Fetch transactions for the period
      const transactionsRes = await fetch(`${getApiUrl()}/transactions/all`)
      const allTransactions = await transactionsRes.json()
      
      // Filter transactions by date range and status
      const filteredTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt || t.date)
        return transactionDate >= startDate && transactionDate <= endDate && t.status === 'completed'
      })

      // Prepare revenue over time data
      const revenueByDay = {}
      filteredTransactions.forEach(t => {
        const date = new Date(t.createdAt || t.date).toISOString().split('T')[0]
        revenueByDay[date] = (revenueByDay[date] || 0) + (t.total || 0)
      })

      const sortedDates = Object.keys(revenueByDay).sort((a, b) => new Date(a) - new Date(b))
      
      setChartData(prev => ({
        ...prev,
        revenueOverTime: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Revenue',
              data: sortedDates.map(date => revenueByDay[date]),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
      }))

      // Prepare transaction trends (count by day)
      const transactionsByDay = {}
      filteredTransactions.forEach(t => {
        const date = new Date(t.createdAt || t.date).toISOString().split('T')[0]
        transactionsByDay[date] = (transactionsByDay[date] || 0) + 1
      })

      setChartData(prev => ({
        ...prev,
        transactionTrends: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Transactions',
              data: sortedDates.map(date => transactionsByDay[date] || 0),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1,
            },
          ],
        },
      }))

      // Prepare sales by category (top 5 products)
      const productSales = {}
      filteredTransactions.forEach(t => {
        if (t.items && Array.isArray(t.items)) {
          t.items.forEach(item => {
            const productName = item.name || 'Unknown'
            const itemTotal = item.total ?? (item.price && item.quantity ? item.price * item.quantity : 0)
            productSales[productName] = (productSales[productName] || 0) + itemTotal
          })
        }
      })

      const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      setChartData(prev => ({
        ...prev,
        salesByCategory: {
          labels: sortedProducts.map(p => p[0]),
          datasets: [
            {
              label: 'Sales',
              data: sortedProducts.map(p => p[1]),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
              ],
              borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(251, 146, 60)',
                'rgb(139, 92, 246)',
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

  const loadDashboardData = async () => {
    try {
      // Load products
      const productsRes = await fetch(`${getApiUrl()}/inventory/products`)
      const productsData = await productsRes.json()
      setProducts(productsData)

      // Calculate stats
      const lowStockCount = productsData.filter(p => p.stock < (p.minStock || 10)).length
      setStats(prev => ({ ...prev, lowStock: lowStockCount }))

      // Load forecasts
      const forecastRes = await fetch(`${getApiUrl()}/forecast/all`)
      const forecastData = await forecastRes.json()
      setForecasts(forecastData)

      // Load expiry alerts
      const expiryRes = await fetch(`${getApiUrl()}/expiry/alerts`)
      const expiryData = await expiryRes.json()
      setExpiryAlerts(expiryData)
      setStats(prev => ({ ...prev, expiringItems: expiryData.length }))

      // Load auto-reorders
      const reorderRes = await fetch(`${getApiUrl()}/autoreorder/all`)
      const reorderData = await reorderRes.json()
      setAutoReorders(reorderData)

      // Calculate profits from transactions
      // TODO: Optimize by adding a backend endpoint for daily totals to reduce data transfer
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const transactionsRes = await fetch(`${getApiUrl()}/transactions/all`)
      const transactions = await transactionsRes.json()
      
      const todaysTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt || t.date)
        return transactionDate >= today && t.status === 'completed'
      })

      let totalRevenue = 0
      let totalProfit = 0
      todaysTransactions.forEach(t => {
        totalRevenue += t.total || 0
        if (t.items && Array.isArray(t.items)) {
          t.items.forEach(item => {
            totalProfit += (item.price - (item.cost || 0)) * item.quantity
          })
        }
      })

      setStats(prev => ({ 
        ...prev, 
        totalRevenue, 
        totalProfit,
        totalTransactions: todaysTransactions.length 
      }))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const generateForecast = () => {
    setActiveTab('forecast')
  }

  const generateExpiryAlerts = () => {
    setActiveTab('expiry')
  }

  const checkAutoReorder = () => {
    setActiveTab('reorder')
  }

  const downloadStockManagement = () => {
    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'quantity', label: 'Current Stock' },
      { key: 'minStock', label: 'Min Stock' },
      { key: 'price', label: 'Price', render: (val) => `$${val?.toFixed(2) || '0.00'}` },
      { key: 'expiryDate', label: 'Expiry Date', render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' }
    ]
    exportToPDF(products, columns, 'Stock Management Report', 'stock-management.pdf')
  }

  const downloadForecast = () => {
    const columns = [
      { key: 'productName', label: 'Product' },
      { key: 'demandForecast', label: 'Weekly Demand' },
      { key: 'recommendedStock', label: 'Recommended Stock' },
      { key: 'confidence', label: 'Confidence', render: (val) => `${(val * 100).toFixed(0)}%` },
      { key: 'trendAnalysis', label: 'Trend' }
    ]
    exportToPDF(forecasts, columns, 'AI Forecast Report', 'ai-forecast.pdf')
  }

  const downloadExpiryAlerts = () => {
    const columns = [
      { key: 'fefoRank', label: 'Rank', render: (val) => `#${val}` },
      { key: 'productName', label: 'Product' },
      { key: 'expiryDate', label: 'Expiry Date', render: (val) => new Date(val).toLocaleDateString() },
      { key: 'daysUntilExpiry', label: 'Days Until Expiry', render: (val) => `${val} days` },
      { key: 'quantity', label: 'Quantity' },
      { key: 'alertLevel', label: 'Alert Level' }
    ]
    exportToPDF(expiryAlerts, columns, 'Expiry Management Report', 'expiry-management.pdf')
  }

  const handleStockUpdate = async (productId, action) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    let quantity = 0
    let reason = ''

    if (action === 'add') {
      const input = prompt(`Add stock for "${product.name}"\n\nEnter quantity to add:`)
      if (!input) return
      quantity = parseInt(input)
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive number')
        return
      }
      reason = prompt('Reason (optional): e.g., "New delivery", "Restock"') || 'Stock added'
    } else if (action === 'remove') {
      const input = prompt(`Remove stock for "${product.name}"\n\nCurrent stock: ${product.quantity || 0}\nEnter quantity to remove:`)
      if (!input) return
      quantity = parseInt(input)
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid positive number')
        return
      }
      if (quantity > (product.quantity || 0)) {
        alert(`Cannot remove ${quantity} units. Only ${product.quantity || 0} units available in stock.`)
        return
      }
      reason = prompt('Reason (optional): e.g., "Expired", "Damaged"') || 'Stock removed'
    }

    try {
      const endpoint = action === 'add' ? '/stock/add' : '/stock/remove'
      const response = await fetch(`${getApiUrl()}/inventory${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, reason })
      })

      const data = await response.json()
      if (response.ok) {
        alert(`✓ ${data.message}`)
        loadDashboardData()
      } else {
        alert(`⚠ Error: ${data.error || 'Failed to update stock'}`)
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('⚠ Failed to update stock. Please try again.')
    }
  }

  const loadDocuments = async () => {
    try {
      // Admin can view all documents by listing all users' documents
      // For simplicity, we'll create an admin-specific endpoint or list all
      const response = await fetch(`${getApiUrl()}/documents/admin/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        console.error('Failed to load documents')
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleDocumentUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadFile) {
      alert('Please select a file to upload')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('userId', user._id)
      formData.append('documentType', uploadType)
      formData.append('description', uploadDescription)
      formData.append('encrypt', 'true') // Enable encryption for admin uploads

      const response = await fetch(`${getApiUrl()}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`✓ Document uploaded successfully!\n\nSecurity Features:\n- Base64 Encoded\n- SHA-256 Hash: ${data.document.contentHash}\n- Digital Signature: ${data.document.signature || 'N/A'}`)
        setUploadFile(null)
        setUploadDescription('')
        setUploadType('general')
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
        loadDocuments()
      } else {
        alert(`⚠ Error: ${data.error || 'Failed to upload document'}`)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('⚠ Failed to upload document. Please try again.')
    }
  }

  const handleDocumentDownload = async (documentId, originalName) => {
    try {
      const response = await fetch(`${getApiUrl()}/documents/download/${documentId}?userId=${user._id}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('✓ Document downloaded successfully with Base64 decoding and integrity verification!')
      } else {
        const data = await response.json()
        alert(`⚠ Error: ${data.error || 'Failed to download document'}`)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('⚠ Failed to download document. Please try again.')
    }
  }

  const handleDocumentDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/documents/delete/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('✓ Document deleted successfully')
        loadDocuments()
      } else {
        alert(`⚠ Error: ${data.error || 'Failed to delete document'}`)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('⚠ Failed to delete document. Please try again.')
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.fullname || user?.username}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationPanel />
          <div style={{ fontSize: '3rem', opacity: 0.2 }}>🎯</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card revenue">
          <h3>💰 Today's Revenue</h3>
          <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
          <p className="info-text">{stats.totalTransactions} transactions</p>
        </div>
        <div className="stat-card profit">
          <h3>📈 Today's Profit</h3>
          <p className="stat-value">${stats.totalProfit.toFixed(2)}</p>
          <p className="info-text">Gross profit margin</p>
        </div>
        <div className="stat-card warning">
          <h3>⚠️ Low Stock Items</h3>
          <p className="stat-value">{stats.lowStock}</p>
          <p className="info-text">Need reordering</p>
        </div>
        <div className="stat-card alert">
          <h3>⏰ Expiring Items</h3>
          <p className="stat-value">{stats.expiringItems}</p>
          <p className="info-text">Requires attention</p>
        </div>
      </div>

      {/* Management Features Toggle */}
      <div className="management-toggle-section">
        <button 
          className={`management-toggle-btn ${showManagementSidebar ? 'active' : ''}`}
          onClick={() => setShowManagementSidebar(!showManagementSidebar)}
        >
          {showManagementSidebar ? '✕ Close' : '☰ Management Features'}
        </button>
      </div>

      {/* Management Sidebar */}
      {showManagementSidebar && (
        <div className="management-sidebar">
          <h3>Management Features</h3>
          <div className="management-grid">
            <button 
              className="management-card"
              onClick={() => { setActiveView('pos'); setShowManagementSidebar(false); }}
            >
              <span className="icon">🛒</span>
              <span>Point of Sale</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('transactions'); setShowManagementSidebar(false); }}
            >
              <span className="icon">💳</span>
              <span>Transactions</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('products'); setShowManagementSidebar(false); }}
            >
              <span className="icon">📦</span>
              <span>Products</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('customers'); setShowManagementSidebar(false); }}
            >
              <span className="icon">👥</span>
              <span>Customers</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('doctors'); setShowManagementSidebar(false); }}
            >
              <span className="icon">👨‍⚕️</span>
              <span>Doctors</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('patients'); setShowManagementSidebar(false); }}
            >
              <span className="icon">🧑‍⚕️</span>
              <span>Patients</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('drugs'); setShowManagementSidebar(false); }}
            >
              <span className="icon">💊</span>
              <span>Drugs</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('prescriptions'); setShowManagementSidebar(false); }}
            >
              <span className="icon">📋</span>
              <span>Prescriptions</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('insurance'); setShowManagementSidebar(false); }}
            >
              <span className="icon">🏥</span>
              <span>Insurance</span>
            </button>
            <button 
              className="management-card"
              onClick={() => { setActiveView('suppliers'); setShowManagementSidebar(false); }}
            >
              <span className="icon">🚚</span>
              <span>Suppliers</span>
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock Management
        </button>
        <button 
          className={activeTab === 'verification' ? 'active' : ''}
          onClick={() => setActiveTab('verification')}
        >
          Doctor Verification
        </button>
        <button 
          className={activeTab === 'forecast' ? 'active' : ''}
          onClick={() => setActiveTab('forecast')}
        >
          AI Forecast
        </button>
        <button 
          className={activeTab === 'expiry' ? 'active' : ''}
          onClick={() => setActiveTab('expiry')}
        >
          Expiry Management
        </button>
        <button 
          className={activeTab === 'reorder' ? 'active' : ''}
          onClick={() => setActiveTab('reorder')}
        >
          Auto-Reorder
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Analytics Charts Section */}
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Sales Analytics</h2>
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
                      <h3>Revenue Over Time</h3>
                      <p className="chart-subtitle">Daily revenue for selected period</p>
                    </div>
                  </div>
                  {chartData.revenueOverTime ? (
                    <LineChart data={chartData.revenueOverTime} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Transaction Trends</h3>
                      <p className="chart-subtitle">Number of transactions per day</p>
                    </div>
                  </div>
                  {chartData.transactionTrends ? (
                    <BarChart data={chartData.transactionTrends} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Top 5 Products by Sales</h3>
                      <p className="chart-subtitle">Best selling products</p>
                    </div>
                  </div>
                  {chartData.salesByCategory ? (
                    <DoughnutChart data={chartData.salesByCategory} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="section">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button onClick={generateForecast} className="btn-primary">
                  🔮 Generate Forecast
                </button>
                <button onClick={generateExpiryAlerts} className="btn-warning">
                  ⚠️ Generate Expiry Alerts
                </button>
                <button onClick={checkAutoReorder} className="btn-success">
                  🔄 Check Auto-Reorder
                </button>
              </div>
            </div>

            {setActiveView && (
              <div className="section" style={{ marginTop: '2rem' }}>
                <h2>Navigation</h2>
                <div className="action-buttons">
                  <button onClick={() => setActiveView('reports')} className="btn-primary">
                    📊 View Reports
                  </button>
                  <button onClick={() => setActiveView('settings')} className="btn-primary">
                    ⚙️ Settings
                  </button>
                </div>
              </div>
            )}

            <div className="section">
              <h2>Low Stock Products</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Min Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.stock < (p.minStock || 10)).slice(0, 5).map(product => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.stock}</td>
                        <td>{product.minStock || 10}</td>
                        <td>
                          <span className="badge badge-warning">Low</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="stock-tab">
            <div className="section-header">
              <div>
                <h2>Stock Management</h2>
                <p className="info-text">Add new stock, update after delivery, or remove expired items</p>
              </div>
              <button onClick={downloadStockManagement} className="btn-primary">
                📥 Download Report
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Price</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.quantity || 0}</td>
                      <td>{product.minStock || 0}</td>
                      <td>${product.price?.toFixed(2)}</td>
                      <td>{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          className="btn-success btn-sm"
                          onClick={() => handleStockUpdate(product._id, 'add')}
                          style={{ marginRight: '5px' }}
                        >
                          + Add
                        </button>
                        <button 
                          className="btn-danger btn-sm"
                          onClick={() => handleStockUpdate(product._id, 'remove')}
                        >
                          - Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="forecast-tab">
            <div className="section-header">
              <h2>AI-Driven Demand Forecast</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={downloadForecast} className="btn-primary">
                  📥 Download Report
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Weekly Demand</th>
                    <th>Recommended Stock</th>
                    <th>Confidence</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(forecasts) && forecasts.length > 0 ? (
                    forecasts.map(forecast => (
                      <tr key={forecast._id}>
                        <td>{forecast.productName}</td>
                        <td>{forecast.demandForecast}</td>
                        <td>{forecast.recommendedStock}</td>
                        <td>{(forecast.confidence * 100).toFixed(0)}%</td>
                        <td>
                          <span className={`badge badge-${forecast.trendAnalysis}`}>
                            {forecast.trendAnalysis}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No forecast data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div className="expiry-tab">
            <div className="section-header">
              <h2>Smart Expiry Management (FEFO)</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={downloadExpiryAlerts} className="btn-primary">
                  📥 Download Report
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Expiry Date</th>
                    <th>Days Until Expiry</th>
                    <th>Quantity</th>
                    <th>Alert Level</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(expiryAlerts) && expiryAlerts.length > 0 ? (
                    expiryAlerts.map(alert => (
                      <tr key={alert._id}>
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No expiry alerts available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="verification-tab">
            <DoctorVerification />
          </div>
        )}

        {activeTab === 'reorder' && (
          <div className="reorder-tab">
            <div className="section-header">
              <h2>Auto-Reorder Management</h2>
              <button onClick={checkAutoReorder} className="btn-success">
                Check & Trigger
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Reorder Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(autoReorders) && autoReorders.length > 0 ? (
                    autoReorders.map(reorder => (
                      <tr key={reorder._id}>
                        <td>{reorder.productName}</td>
                        <td>{reorder.supplierName || 'N/A'}</td>
                        <td>{reorder.currentStock}</td>
                        <td>{reorder.reorderLevel}</td>
                        <td>{reorder.reorderQuantity}</td>
                        <td>
                          <span className={`badge badge-${reorder.status}`}>
                            {reorder.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No auto-reorder data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-tab">
            <div className="section">
              <h2>📄 Document Management</h2>
              <p className="info-text">Upload and manage documents with Base64 encoding/decoding and security features</p>
              
              {/* Upload Section */}
              <div className="section" style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                <h3>Upload New Document</h3>
                <form onSubmit={handleDocumentUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>File:</label>
                    <input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      required
                      style={{ padding: '0.5rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Document Type:</label>
                    <select 
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      style={{ padding: '0.5rem', width: '100%' }}
                    >
                      <option value="general">General</option>
                      <option value="medical">Medical</option>
                      <option value="legal">Legal</option>
                      <option value="financial">Financial</option>
                      <option value="prescription">Prescription</option>
                      <option value="invoice">Invoice</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description:</label>
                    <textarea 
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter document description..."
                      rows="3"
                      style={{ padding: '0.5rem', width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    🔒 Upload (Base64 Encoded)
                  </button>
                </form>
                
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <strong>🔐 Security Features:</strong>
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    <li>Base64 encoding for secure storage</li>
                    <li>SHA-256 hash for integrity verification</li>
                    <li>Digital signature with RSA keys</li>
                    <li>Automatic content validation on download</li>
                  </ul>
                </div>
              </div>

              {/* Documents List */}
              <div className="section" style={{ marginTop: '2rem' }}>
                <h3>All Documents</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Encrypted</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length > 0 ? (
                        documents.map(doc => (
                          <tr key={doc._id}>
                            <td>
                              <div>
                                <strong>{doc.originalName}</strong>
                                {doc.description && (
                                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                    {doc.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ 
                                backgroundColor: doc.documentType === 'medical' ? '#10b981' : 
                                               doc.documentType === 'legal' ? '#f59e0b' :
                                               doc.documentType === 'financial' ? '#3b82f6' : '#6b7280',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}>
                                {doc.documentType}
                              </span>
                            </td>
                            <td>{(doc.size / 1024).toFixed(2)} KB</td>
                            <td>
                              {doc.encrypted ? (
                                <span style={{ color: '#10b981' }}>🔒 Yes</span>
                              ) : (
                                <span style={{ color: '#6b7280' }}>🔓 No</span>
                              )}
                            </td>
                            <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn-primary btn-sm"
                                onClick={() => handleDocumentDownload(doc._id, doc.originalName)}
                                style={{ marginRight: '5px' }}
                                title="Download with Base64 decoding"
                              >
                                📥 Download
                              </button>
                              <button 
                                className="btn-danger btn-sm"
                                onClick={() => handleDocumentDelete(doc._id)}
                                title="Delete document"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            No documents available. Upload your first document above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
