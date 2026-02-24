import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import { useAuth } from '../contexts/AuthContext'
import './DoctorVerification.css'

function DoctorVerification() {
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadPendingDoctors()
  }, [])

  const loadPendingDoctors = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl()}/doctors/pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingDoctors(data)
      }
    } catch (error) {
      console.error('Error loading pending doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyDoctor = async (doctorId, approved) => {
    try {
      const response = await fetch(`${getApiUrl()}/doctors/verify/${doctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: user._id,
          approved,
          rejectionReason: approved ? null : rejectionReason
        }),
      })

      if (response.ok) {
        alert(approved ? 'Doctor verified successfully!' : 'Doctor verification rejected')
        setSelectedDoctor(null)
        setRejectionReason('')
        loadPendingDoctors()
      } else {
        alert('Failed to update doctor verification status')
      }
    } catch (error) {
      console.error('Error verifying doctor:', error)
      alert('Failed to update verification status')
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
        alert('✓ Document downloaded successfully!')
      } else {
        let errorMessage = 'Failed to download document'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (e) {
          // Response wasn't JSON, use default error message
        }
        alert(`⚠ Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('⚠ Failed to download document. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="doctor-verification-loading">
        <div className="spinner"></div>
        <p>Loading pending verifications...</p>
      </div>
    )
  }

  if (selectedDoctor) {
    return (
      <div className="doctor-verification-detail">
        <button className="back-button" onClick={() => setSelectedDoctor(null)}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to List
        </button>

        <div className="doctor-profile-card">
          <div className="profile-header">
            <div className="doctor-avatar">
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <div>
              <h2>{selectedDoctor.name}</h2>
              <p className="specialization">{selectedDoctor.specialization}</p>
            </div>
          </div>

          <div className="profile-sections">
            <div className="profile-section">
              <h3>Contact Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Email:</label>
                  <span>{selectedDoctor.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{selectedDoctor.phone}</span>
                </div>
                <div className="info-item">
                  <label>Address:</label>
                  <span>{selectedDoctor.address || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Professional Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Qualification:</label>
                  <span>{selectedDoctor.qualification}</span>
                </div>
                <div className="info-item">
                  <label>License Number:</label>
                  <span>{selectedDoctor.licenseNumber}</span>
                </div>
                <div className="info-item">
                  <label>Experience:</label>
                  <span>{selectedDoctor.experience} years</span>
                </div>
                <div className="info-item">
                  <label>Consultation Fee:</label>
                  <span>${selectedDoctor.consultationFee}</span>
                </div>
              </div>
            </div>

            {selectedDoctor.bio && (
              <div className="profile-section">
                <h3>Bio</h3>
                <p>{selectedDoctor.bio}</p>
              </div>
            )}

            <div className="profile-section">
              <h3>Uploaded Documents</h3>
              {selectedDoctor.documents && selectedDoctor.documents.length > 0 ? (
                <div className="documents-list">
                  {selectedDoctor.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <span className="material-symbols-outlined">description</span>
                      <div className="document-info">
                        <span className="document-name">{doc.name}</span>
                        <span className="document-type">{doc.type}</span>
                      </div>
                      <button 
                        onClick={() => handleDocumentDownload(
                          doc.documentId?._id || doc.documentId,
                          doc.name
                        )}
                        className="download-button"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-documents">No documents uploaded</p>
              )}
            </div>
          </div>

          <div className="verification-actions">
            <div className="rejection-section">
              <label htmlFor="rejection-reason">Rejection Reason (if rejecting):</label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows="3"
              />
            </div>

            <div className="action-buttons">
              <button 
                className="reject-button" 
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert('Please provide a rejection reason')
                    return
                  }
                  if (confirm('Are you sure you want to reject this doctor?')) {
                    verifyDoctor(selectedDoctor._id, false)
                  }
                }}
              >
                <span className="material-symbols-outlined">close</span>
                Reject
              </button>
              <button 
                className="approve-button" 
                onClick={() => {
                  if (confirm('Are you sure you want to approve this doctor?')) {
                    verifyDoctor(selectedDoctor._id, true)
                  }
                }}
              >
                <span className="material-symbols-outlined">check</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="doctor-verification">
      <div className="verification-header">
        <h2>Doctor Verification Requests</h2>
        <p>Review and approve doctor registration requests</p>
      </div>

      {pendingDoctors.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined">verified_user</span>
          <h3>No Pending Verifications</h3>
          <p>All doctor registration requests have been processed</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {pendingDoctors.map(doctor => (
            <div key={doctor._id} className="doctor-card">
              <div className="card-header">
                <div className="doctor-avatar-small">
                  <span className="material-symbols-outlined">medical_services</span>
                </div>
                <div className="doctor-basic-info">
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialization}</p>
                  <small>{doctor.email}</small>
                </div>
              </div>
              <div className="card-details">
                <div className="detail-row">
                  <span className="detail-label">Qualification:</span>
                  <span>{doctor.qualification}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Experience:</span>
                  <span>{doctor.experience} years</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Documents:</span>
                  <span>{doctor.documents?.length || 0} uploaded</span>
                </div>
              </div>
              <button 
                className="review-button" 
                onClick={() => setSelectedDoctor(doctor)}
              >
                Review Application
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorVerification
