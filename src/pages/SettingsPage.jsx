import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    storeName: 'PharmaSpot',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    taxRate: 0,
    currency: 'USD'
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    role: 'worker'
  })

  useEffect(() => {
    fetchSettings()
    fetchUsers()
    fetchUserTwoFactorStatus()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/settings/all`)
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setSettings(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/users/all`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchUserTwoFactorStatus = async () => {
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

  const handleSettingsUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${getApiUrl()}/settings/new`, {
        method: settings._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Settings updated successfully!')
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${getApiUrl()}/users/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUser,
          id: '',
          perm_products: newUser.role === 'admin' ? 1 : 0,
          perm_categories: newUser.role === 'admin' ? 1 : 0,
          perm_transactions: newUser.role === 'admin' ? 1 : 0,
          perm_users: newUser.role === 'admin' ? 1 : 0,
          perm_settings: newUser.role === 'admin' ? 1 : 0
        })
      })

      if (response.ok) {
        alert('User added successfully!')
        setShowAddUserModal(false)
        setNewUser({
          username: '',
          fullname: '',
          email: '',
          password: '',
          role: 'worker'
        })
        fetchUsers()
      } else {
        throw new Error('Failed to add user')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`${getApiUrl()}/users/user/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('User deleted successfully!')
        fetchUsers()
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>⚙️ Settings</h1>
        <p>Manage system settings and configurations</p>
      </div>

      <div className="tab-content">
        <div className="section">
          <h2>Store Information</h2>
          <form onSubmit={handleSettingsUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="input-group">
                <label>Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="input-group">
                <label>Store Email</label>
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="input-group">
                <label>Store Phone</label>
                <input
                  type="tel"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="input-group">
                <label>Store Address</label>
                <input
                  type="text"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="input-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="input-group">
                <label>Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <h2>Security Settings</h2>
          <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-secondary, #f9fafb)', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Two-Factor Authentication</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Add an extra layer of security to your account by requiring a verification code in addition to your password.
                </p>
                {user && !user.email && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.875rem' }}>
                    ⚠️ Email address is required to enable two-factor authentication. Please add an email to your profile first.
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
                <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: twoFactorEnabled ? '#10b981' : '#6b7280' }}>
                  {twoFactorLoading ? 'Loading...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>User Management</h2>
            <button 
              className="btn-primary" 
              onClick={() => setShowAddUserModal(true)}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              + Add User
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.fullname || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${user.role === 'admin' ? 'danger' : user.role === 'worker' ? 'info' : 'success'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Add New User</h2>
              <form onSubmit={handleAddUser}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Username *</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullname}
                    onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role *</label>
                  <select
                    required
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false)
                      setNewUser({
                        username: '',
                        fullname: '',
                        email: '',
                        password: '',
                        role: 'worker'
                      })
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    {loading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="section" style={{ marginTop: '2rem' }}>
          <h2>System Information</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Version</h3>
              <p className="stat-value">1.5.1</p>
            </div>
            <div className="stat-card">
              <h3>Environment</h3>
              <p className="stat-value" style={{ fontSize: '1.25rem' }}>Production</p>
            </div>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-value">{users.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
