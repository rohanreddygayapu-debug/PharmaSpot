import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import { useAuth } from '../contexts/AuthContext'
import { exportToPDF } from '../utils/exportUtils'
import './CustomersPage.css'

function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, verified, rejected
  const { user } = useAuth()

  useEffect(() => {
    loadDoctors()
  }, [filter])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      let endpoint = `${getApiUrl()}/doctors`
      
      if (filter === 'pending') {
        endpoint = `${getApiUrl()}/doctors/pending`
      } else if (filter === 'verified') {
        endpoint = `${getApiUrl()}/doctors/verified`
      }
      
      const response = await fetch(endpoint)
      let data = await response.json()
      
      // Filter by verification status if needed
      if (filter === 'rejected') {
        data = data.filter(doc => doc.verificationStatus === 'rejected')
      }
      
      setDoctors(data)
    } catch (error) {
      console.error('Error loading doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (doctorId, approved, rejectionReason = '') => {
    try {
      const response = await fetch(`${getApiUrl()}/doctors/verify/${doctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: user._id,
          approved,
          rejectionReason,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(data.message)
        loadDoctors()
      } else {
        alert('Failed to update verification status')
      }
    } catch (error) {
      console.error('Error updating verification:', error)
      alert('Failed to update verification status')
    }
  }

  const handleApprove = (doctorId) => {
    if (window.confirm('Are you sure you want to approve this doctor?')) {
      handleVerification(doctorId, true)
    }
  }

  const handleReject = (doctorId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      handleVerification(doctorId, false, reason)
    }
  }

  const getStatusBadge = (doctor) => {
    if (doctor.verified) {
      return <span className="badge badge-success">✓ Verified</span>
    } else if (doctor.verificationStatus === 'pending') {
      return <span className="badge badge-warning">⏳ Pending</span>
    } else if (doctor.verificationStatus === 'rejected') {
      return <span className="badge badge-danger">✗ Rejected</span>
    }
    return <span className="badge badge-secondary">Unknown</span>
  }

  const downloadDoctors = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'experience', label: 'Experience (years)' },
      { key: 'licenseNumber', label: 'License No.' },
      { key: 'verificationStatus', label: 'Status', render: (val, row) => row.verified ? 'Verified' : val || 'Unknown' }
    ]
    exportToPDF(doctors, columns, 'Doctors Report', 'doctors.pdf')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>👨‍⚕️ Doctors Management</h1>
          <p>Manage doctor profiles and verification</p>
        </div>
        <button onClick={downloadDoctors} className="btn-primary">
          📥 Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <p className="stat-value">{doctors.length}</p>
        </div>
        <div className="stat-card">
          <h3>Verified</h3>
          <p className="stat-value" style={{ color: '#10b981' }}>
            {doctors.filter(d => d.verified).length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending Review</h3>
          <p className="stat-value" style={{ color: '#f59e0b' }}>
            {doctors.filter(d => d.verificationStatus === 'pending').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-value" style={{ color: '#ef4444' }}>
            {doctors.filter(d => d.verificationStatus === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters" style={{ marginBottom: '1rem' }}>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Doctors
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({doctors.filter(d => d.verificationStatus === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
          onClick={() => setFilter('verified')}
        >
          Verified ({doctors.filter(d => d.verified).length})
        </button>
        <button
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({doctors.filter(d => d.verificationStatus === 'rejected').length})
        </button>
      </div>

      {/* Doctors Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading doctors...</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>License No.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No doctors found
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor._id}>
                    <td>
                      <strong>{doctor.name}</strong>
                      {doctor.qualification && (
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {doctor.qualification}
                        </div>
                      )}
                    </td>
                    <td>{doctor.email}</td>
                    <td>{doctor.phone || 'N/A'}</td>
                    <td>{doctor.specialization || 'N/A'}</td>
                    <td>{doctor.experience || 0} years</td>
                    <td>{doctor.licenseNumber || 'N/A'}</td>
                    <td>{getStatusBadge(doctor)}</td>
                    <td>
                      {doctor.verificationStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-success btn-sm"
                            onClick={() => handleApprove(doctor._id)}
                            title="Approve Doctor"
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleReject(doctor._id)}
                            title="Reject Doctor"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {doctor.verificationStatus === 'rejected' && doctor.rejectionReason && (
                        <button
                          className="btn-info btn-sm"
                          onClick={() => alert(`Rejection Reason:\n${doctor.rejectionReason}`)}
                          title="View Rejection Reason"
                        >
                          View Reason
                        </button>
                      )}
                      {doctor.verified && (
                        <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
                          ✓ Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default DoctorsPage
