import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/config'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AppointmentPaymentModal from '../components/AppointmentPaymentModal'
import { LineChart, BarChart, DoughnutChart } from '../components/Charts'
import '../components/Charts.css'
import './Dashboard.css'
import './DoctorDashboard.css'

function DoctorDashboard() {
  const [activeView, setActiveView] = useState('dashboard')
  const [doctorProfile, setDoctorProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [chats, setChats] = useState([])
  const [payments, setPayments] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    unreadChats: 0,
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({
    earningsOverTime: null,
    bookingsOverTime: null,
    appointmentStatus: null
  })
  const [chartPeriod, setChartPeriod] = useState('30days')
  const { user } = useAuth()

  useEffect(() => {
    loadDoctorData()
  }, [user])

  useEffect(() => {
    if (doctorProfile && user) {
      loadChartData()
    }
  }, [chartPeriod, doctorProfile, user])

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
          startDate.setDate(startDate.getDate() - 30)
      }

      // Fetch appointments for the period
      const appointmentsRes = await fetch(`${getApiUrl()}/appointments/doctor/${user._id}`)
      if (!appointmentsRes.ok) return
      
      const allAppointments = await appointmentsRes.json()
      
      // Filter appointments by date range
      const filteredAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate >= startDate && aptDate <= endDate
      })

      // Prepare earnings over time data (completed appointments)
      const earningsByDay = {}
      const completedApts = filteredAppointments.filter(apt => apt.status === 'completed')
      
      completedApts.forEach(apt => {
        const date = new Date(apt.appointmentDate).toISOString().split('T')[0]
        earningsByDay[date] = (earningsByDay[date] || 0) + (apt.consultationFee || 0)
      })

      const sortedDates = Object.keys(earningsByDay).sort((a, b) => new Date(a) - new Date(b))
      
      setChartData(prev => ({
        ...prev,
        earningsOverTime: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Earnings ($)',
              data: sortedDates.map(date => earningsByDay[date]),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
      }))

      // Prepare bookings over time data (all appointments)
      const bookingsByDay = {}
      filteredAppointments.forEach(apt => {
        const date = new Date(apt.appointmentDate).toISOString().split('T')[0]
        bookingsByDay[date] = (bookingsByDay[date] || 0) + 1
      })

      const allDates = Object.keys(bookingsByDay).sort((a, b) => new Date(a) - new Date(b))

      setChartData(prev => ({
        ...prev,
        bookingsOverTime: {
          labels: allDates,
          datasets: [
            {
              label: 'Bookings',
              data: allDates.map(date => bookingsByDay[date]),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
            },
          ],
        },
      }))

      // Prepare appointment status breakdown
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      }

      filteredAppointments.forEach(apt => {
        if (statusCounts.hasOwnProperty(apt.status)) {
          statusCounts[apt.status]++
        }
      })

      setChartData(prev => ({
        ...prev,
        appointmentStatus: {
          labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
          datasets: [
            {
              label: 'Appointments',
              data: [
                statusCounts.pending,
                statusCounts.confirmed,
                statusCounts.completed,
                statusCounts.cancelled
              ],
              backgroundColor: [
                'rgba(251, 146, 60, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(239, 68, 68, 0.8)',
              ],
              borderColor: [
                'rgb(251, 146, 60)',
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(239, 68, 68)',
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

  const loadDoctorData = async () => {
    try {
      setLoading(true)

      // Load doctor profile
      const profileRes = await fetch(`${getApiUrl()}/doctors/user/${user._id}`)
      if (profileRes.ok) {
        const profile = await profileRes.json()
        setDoctorProfile(profile)
      }

      // Load appointments
      const appointmentsRes = await fetch(`${getApiUrl()}/appointments/doctor/${user._id}`)
      if (appointmentsRes.ok) {
        const appts = await appointmentsRes.json()
        setAppointments(appts)
        
        // Calculate appointment stats
        const completed = appts.filter(a => a.status === 'completed').length
        const pending = appts.filter(a => a.status === 'pending').length
        const uniquePatients = new Set(appts.map(a => a.patientId || a.patientName)).size
        
        setStats(prev => ({
          ...prev,
          totalAppointments: appts.length,
          completedAppointments: completed,
          pendingAppointments: pending,
          totalPatients: uniquePatients,
        }))
      }

      // Load chats
      const chatsRes = await fetch(`${getApiUrl()}/chats/user/${user._id}`)
      if (chatsRes.ok) {
        const chatData = await chatsRes.json()
        setChats(chatData)
        const unread = chatData.filter(c => c.unread).length
        setStats(prev => ({ ...prev, unreadChats: unread }))
      }

      // Load payments/earnings
      const paymentsRes = await fetch(`${getApiUrl()}/appointments/doctor/${user._id}`)
      if (paymentsRes.ok) {
        const appts = await paymentsRes.json()
        const completedAppts = appts.filter(a => a.status === 'completed')
        
        // Calculate earnings from completed appointments
        const totalEarnings = completedAppts.reduce((sum, apt) => {
          return sum + (apt.consultationFee || 0)
        }, 0)
        
        const pendingAppts = appts.filter(a => a.status === 'confirmed')
        const pendingPayments = pendingAppts.reduce((sum, apt) => {
          return sum + (apt.consultationFee || 0)
        }, 0)
        
        setPayments(completedAppts.map(apt => ({
          id: apt._id,
          date: apt.appointmentDate,
          patientName: apt.patientName,
          amount: apt.consultationFee || 0,
          status: 'completed',
        })))
        
        setStats(prev => ({
          ...prev,
          totalEarnings,
          pendingPayments,
        }))
      }
    } catch (error) {
      console.error('Error loading doctor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )
    }

    // Check if profile is complete
    if (!doctorProfile) {
      return (
        <div className="doctor-setup-message">
          <div className="setup-card">
            <span className="material-symbols-outlined setup-icon">medical_services</span>
            <h2>Complete Your Doctor Profile</h2>
            <p>You need to complete your profile and upload verification documents before you can access the dashboard.</p>
            <button className="primary-button" onClick={() => setActiveView('profile')}>
              Complete Profile
            </button>
          </div>
        </div>
      )
    }

    // Check verification status
    if (!doctorProfile.verified) {
      return (
        <div className="doctor-setup-message">
          <div className="setup-card">
            <span className="material-symbols-outlined setup-icon">pending</span>
            <h2>Profile Under Review</h2>
            <p>Your profile and documents are being reviewed by our admin team. You'll be notified once verified.</p>
            {doctorProfile.verificationStatus === 'rejected' && (
              <div className="rejection-notice">
                <strong>Rejection Reason:</strong>
                <p>{doctorProfile.rejectionReason || 'Please contact support for more details.'}</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="doctor-overview">
            <div className="page-header">
              <h1>Welcome, Dr. {doctorProfile?.name || user.fullname}</h1>
              <p>Here's your practice overview</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>Total Earnings</h3>
                  <p className="stat-value">${stats.totalEarnings.toFixed(2)}</p>
                  <small>From {stats.completedAppointments} appointments</small>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Payments</h3>
                  <p className="stat-value">${stats.pendingPayments.toFixed(2)}</p>
                  <small>From {stats.pendingAppointments} appointments</small>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Total Appointments</h3>
                  <p className="stat-value">{stats.totalAppointments}</p>
                  <small>{stats.completedAppointments} completed</small>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Patients</h3>
                  <p className="stat-value">{stats.totalPatients}</p>
                  <small>Unique patients served</small>
                </div>
              </div>
            </div>

            {/* Analytics Charts Section */}
            <div className="section" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Practice Analytics</h2>
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
                      <h3>Earnings Over Time</h3>
                      <p className="chart-subtitle">Consultation fees from completed appointments</p>
                    </div>
                  </div>
                  {chartData.earningsOverTime ? (
                    <LineChart data={chartData.earningsOverTime} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Bookings Over Time</h3>
                      <p className="chart-subtitle">Number of appointments per day</p>
                    </div>
                  </div>
                  {chartData.bookingsOverTime ? (
                    <BarChart data={chartData.bookingsOverTime} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h3>Appointment Status</h3>
                      <p className="chart-subtitle">Breakdown by status</p>
                    </div>
                  </div>
                  {chartData.appointmentStatus ? (
                    <DoughnutChart data={chartData.appointmentStatus} height={300} />
                  ) : (
                    <div className="chart-loading">Loading chart...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="dashboard-sections">
              <div className="dashboard-section">
                <h2>Recent Appointments</h2>
                <div className="mini-appointments-list">
                  {appointments.slice(0, 5).map(apt => (
                    <div key={apt._id} className="mini-appointment-card">
                      <div className="mini-apt-header">
                        <strong>{apt.patientName}</strong>
                        <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                      </div>
                      <div className="mini-apt-details">
                        <span>📅 {new Date(apt.appointmentDate).toLocaleDateString()}</span>
                        <span>🕐 {apt.appointmentTime}</span>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="empty-message">No appointments yet</p>
                  )}
                </div>
              </div>

              <div className="dashboard-section">
                <h2>Recent Messages</h2>
                <div className="mini-chats-list">
                  {chats.slice(0, 5).map(chat => (
                    <div key={chat._id} className="mini-chat-card">
                      <div className="mini-chat-header">
                        <strong>{chat.userId?.fullname || chat.userId?.username || 'Patient'}</strong>
                        {chat.unread && <span className="unread-badge">New</span>}
                      </div>
                      <p className="mini-chat-preview">{chat.lastMessage}</p>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <p className="empty-message">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'appointments':
        return (
          <div className="appointments-view">
            <div className="page-header">
              <h1>My Appointments</h1>
              <p>Manage your upcoming and past appointments</p>
            </div>
            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">event_busy</span>
                  <p>No appointments scheduled</p>
                </div>
              ) : (
                appointments.map(apt => (
                  <div key={apt._id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-date">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                        <span>{apt.appointmentTime}</span>
                      </div>
                      <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                    </div>
                    <div className="appointment-details">
                      <h3>{apt.patientName}</h3>
                      <p><strong>Phone:</strong> {apt.patientPhone}</p>
                      <p><strong>Reason:</strong> {apt.reason || 'Not specified'}</p>
                      {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                      {apt.consultationFee && (
                        <p><strong>Fee:</strong> ${apt.consultationFee}</p>
                      )}
                    </div>
                    <div className="appointment-actions">
                      {apt.status === 'pending' && (
                        <>
                          <button className="btn-confirm" onClick={() => updateAppointmentStatus(apt._id, 'confirmed')}>
                            Confirm
                          </button>
                          <button className="btn-cancel" onClick={() => updateAppointmentStatus(apt._id, 'cancelled')}>
                            Cancel
                          </button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button className="btn-complete" onClick={() => updateAppointmentStatus(apt._id, 'completed')}>
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )

      case 'patients':
        return (
          <div className="patients-view">
            <div className="page-header">
              <h1>Patient Requests</h1>
              <p>Manage patient appointment requests and consultations</p>
            </div>
            
            <div className="requests-stats">
              <div className="request-stat">
                <h3>Pending Requests</h3>
                <p className="stat-value">{appointments.filter(a => a.status === 'pending').length}</p>
              </div>
              <div className="request-stat">
                <h3>Confirmed</h3>
                <p className="stat-value">{appointments.filter(a => a.status === 'confirmed').length}</p>
              </div>
              <div className="request-stat">
                <h3>Completed</h3>
                <p className="stat-value">{appointments.filter(a => a.status === 'completed').length}</p>
              </div>
            </div>

            <div className="patients-list">
              {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">people</span>
                  <p>No active patient requests</p>
                </div>
              ) : (
                appointments
                  .filter(a => a.status === 'pending' || a.status === 'confirmed')
                  .map(apt => (
                    <div key={apt._id} className="patient-request-card">
                      <div className="patient-header">
                        <div>
                          <h3>{apt.patientName}</h3>
                          <p>{apt.patientPhone}</p>
                        </div>
                        <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                      </div>
                      <div className="patient-details">
                        <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {apt.appointmentTime}</p>
                        <p><strong>Reason:</strong> {apt.reason || 'Not specified'}</p>
                        {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                      </div>
                      <div className="patient-actions">
                        {apt.status === 'pending' && (
                          <>
                            <button className="btn-confirm" onClick={() => updateAppointmentStatus(apt._id, 'confirmed')}>
                              Accept Request
                            </button>
                            <button className="btn-cancel" onClick={() => updateAppointmentStatus(apt._id, 'cancelled')}>
                              Decline
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <button className="btn-complete" onClick={() => updateAppointmentStatus(apt._id, 'completed')}>
                            Complete Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="payments-view">
            <div className="page-header">
              <h1>Payments & Earnings</h1>
              <p>Track your consultation fees and earnings</p>
            </div>

            <div className="payment-summary">
              <div className="payment-card total">
                <h3>💰 Total Earnings</h3>
                <p className="amount">${stats.totalEarnings.toFixed(2)}</p>
                <small>From {stats.completedAppointments} consultations</small>
              </div>
              <div className="payment-card pending">
                <h3>⏳ Pending</h3>
                <p className="amount">${stats.pendingPayments.toFixed(2)}</p>
                <small>From {stats.pendingAppointments} appointments</small>
              </div>
              <div className="payment-card average">
                <h3>📊 Average Fee</h3>
                <p className="amount">
                  ${stats.completedAppointments > 0 
                    ? (stats.totalEarnings / stats.completedAppointments).toFixed(2)
                    : '0.00'}
                </p>
                <small>Per consultation</small>
              </div>
            </div>

            <div className="payments-table">
              <h2>Payment History</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                        No payment records yet
                      </td>
                    </tr>
                  ) : (
                    payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{payment.patientName}</td>
                        <td>${payment.amount.toFixed(2)}</td>
                        <td>
                          <span className="badge badge-success">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      
      case 'chats':
        return (
          <div className="chats-view">
            <div className="page-header">
              <h1>Messages</h1>
              <p>Chat with your patients</p>
            </div>
            
            {stats.unreadChats > 0 && (
              <div className="unread-notice">
                <span className="material-symbols-outlined">notifications</span>
                <p>You have {stats.unreadChats} unread messages</p>
              </div>
            )}

            <div className="chats-list">
              {chats.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                  <p>No messages yet</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div key={chat._id} className="chat-card">
                    <div className="chat-header">
                      <div className="chat-avatar">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="chat-info">
                        <h3>{chat.userId?.fullname || chat.userId?.username || 'Patient'}</h3>
                        <p className="chat-preview">{chat.lastMessage}</p>
                      </div>
                      {chat.unread && <span className="unread-indicator"></span>}
                    </div>
                    <div className="chat-meta">
                      <small>{new Date(chat.lastMessageAt).toLocaleString()}</small>
                      <button className="btn-primary btn-sm">Open Chat</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )

      case 'profile':
        return <DoctorProfileView doctorProfile={doctorProfile} onUpdate={loadDoctorData} />

      default:
        return null
    }
  }

  const updateAppointmentStatus = async (appointmentId, status) => {
    // If status is 'completed', show payment modal instead of updating directly
    if (status === 'completed') {
      const appointment = appointments.find(apt => apt._id === appointmentId)
      if (appointment) {
        setSelectedAppointment(appointment)
        setShowPaymentModal(true)
      }
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        alert(`Appointment ${status}!`)
        loadDoctorData()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handlePaymentComplete = async (paymentMethod) => {
    try {
      const response = await fetch(`${getApiUrl()}/appointments/${selectedAppointment._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentMethod,
          paymentStatus: 'paid'
        }),
      })

      if (response.ok) {
        alert('Appointment completed successfully!')
        setShowPaymentModal(false)
        setSelectedAppointment(null)
        loadDoctorData()
      } else {
        throw new Error('Failed to complete appointment')
      }
    } catch (error) {
      console.error('Error completing appointment:', error)
      throw error
    }
  }

  function DoctorProfileView({ doctorProfile, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedProfile, setEditedProfile] = useState(doctorProfile || {})
    const [saving, setSaving] = useState(false)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [twoFactorLoading, setTwoFactorLoading] = useState(false)

    useEffect(() => {
      if (doctorProfile) {
        setEditedProfile(doctorProfile)
      }
    }, [doctorProfile])

    useEffect(() => {
      fetchTwoFactorStatus()
    }, [user])

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

    const handleEdit = () => {
      setIsEditing(true)
    }

    const handleCancel = () => {
      setEditedProfile(doctorProfile)
      setIsEditing(false)
    }

    const handleChange = (e) => {
      const { name, value } = e.target
      setEditedProfile(prev => ({
        ...prev,
        [name]: value
      }))
    }

    const handleSave = async () => {
      try {
        setSaving(true)
        const response = await fetch(`${getApiUrl()}/doctors/${doctorProfile._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedProfile),
        })

        if (response.ok) {
          alert('Profile updated successfully!')
          setIsEditing(false)
          onUpdate()
        } else {
          alert('Failed to update profile')
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile')
      } finally {
        setSaving(false)
      }
    }

    if (!doctorProfile) {
      return (
        <div className="profile-view">
          <div className="page-header">
            <h1>My Profile</h1>
            <p>Manage your professional information</p>
          </div>
          <div className="empty-state">
            <p>No profile data available</p>
          </div>
        </div>
      )
    }

    return (
      <div className="profile-view">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>Manage your professional information</p>
          </div>
          {!isEditing ? (
            <button className="btn-primary" onClick={handleEdit}>
              <span className="material-symbols-outlined">edit</span>
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
        
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedProfile.name || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.name}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editedProfile.email || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.email}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editedProfile.phone || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.phone}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={editedProfile.address || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.address}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Professional Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Specialization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="specialization"
                      value={editedProfile.specialization || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.specialization}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Qualification</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="qualification"
                      value={editedProfile.qualification || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.qualification}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Experience</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="experience"
                      value={editedProfile.experience || ''}
                      onChange={handleChange}
                      className="edit-input"
                      min="0"
                    />
                  ) : (
                    <p>{doctorProfile.experience} years</p>
                  )}
                </div>
                <div className="info-item">
                  <label>License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="licenseNumber"
                      value={editedProfile.licenseNumber || ''}
                      onChange={handleChange}
                      className="edit-input"
                    />
                  ) : (
                    <p>{doctorProfile.licenseNumber}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Consultation Fee</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="consultationFee"
                      value={editedProfile.consultationFee || ''}
                      onChange={handleChange}
                      className="edit-input"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p>${doctorProfile.consultationFee}</p>
                  )}
                </div>
                <div className="info-item">
                  <label>Verification Status</label>
                  <p>
                    {doctorProfile.verified ? (
                      <span className="badge badge-success">✓ Verified</span>
                    ) : (
                      <span className="badge badge-warning">Pending Verification</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Bio</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editedProfile.bio || ''}
                  onChange={handleChange}
                  className="edit-textarea"
                  rows="5"
                  placeholder="Tell patients about yourself and your practice..."
                />
              ) : (
                <p>{doctorProfile.bio || 'No bio provided'}</p>
              )}
            </div>

            <div className="profile-section">
              <h3>Security Settings</h3>
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
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard doctor-portal">
      <div className="doctor-sidebar">
        <div className="sidebar-header">
          <h2>Doctor Portal</h2>
          <p className="doctor-name">Dr. {doctorProfile?.name || user.fullname}</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeView === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveView('appointments')}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span>Appointments</span>
          </button>
          <button
            className={`nav-item ${activeView === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveView('patients')}
          >
            <span className="material-symbols-outlined">people</span>
            <span>Patient Requests</span>
            {stats.pendingAppointments > 0 && (
              <span className="badge-count">{stats.pendingAppointments}</span>
            )}
          </button>
          <button
            className={`nav-item ${activeView === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveView('payments')}
          >
            <span className="material-symbols-outlined">payments</span>
            <span>Payments</span>
          </button>
          <button
            className={`nav-item ${activeView === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveView('chats')}
          >
            <span className="material-symbols-outlined">chat</span>
            <span>Messages</span>
            {stats.unreadChats > 0 && (
              <span className="badge-count">{stats.unreadChats}</span>
            )}
          </button>
          <button
            className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </button>
        </nav>
      </div>
      <div className="doctor-main-content">
        <Navbar activeView={activeView} setActiveView={setActiveView} userRole="doctor" />
        <div className="dashboard-content">
          {renderContent()}
        </div>
        <Footer />
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && selectedAppointment && (
        <AppointmentPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}

export default DoctorDashboard
