import React, { useState } from 'react'
import { getApiUrl } from '../utils/config'
import './DoctorDetailsForm.css'

function DoctorDetailsForm({ userId, onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    qualification: '',
    experience: '',
    licenseNumber: '',
    consultationFee: '',
    bio: '',
  })
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    const newDocs = files.map(file => ({
      file,
      name: file.name,
      type: 'other'
    }))
    setDocuments(prev => [...prev, ...newDocs])
  }

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.specialization || !formData.qualification || !formData.licenseNumber) {
      setError('Please fill in all required fields')
      return
    }

    if (documents.length === 0) {
      setError('Please upload at least one verification document')
      return
    }

    setLoading(true)

    try {
      // Upload each document using Base64 encoding via the documents API
      const uploadedDocuments = []
      
      for (const doc of documents) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', doc.file)
        uploadFormData.append('userId', userId)
        uploadFormData.append('documentType', 'doctor-' + doc.type)
        uploadFormData.append('description', `Doctor verification document: ${doc.name}`)
        uploadFormData.append('encrypt', 'true') // Enable encryption

        const uploadResponse = await fetch(`${getApiUrl()}/documents/upload`, {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload document: ${doc.name}`)
        }

        const uploadData = await uploadResponse.json()
        
        // Store document reference with ID instead of URL
        uploadedDocuments.push({
          name: doc.name,
          documentId: uploadData.document._id,
          type: doc.type || 'other'
        })
      }

      const doctorData = {
        userId,
        ...formData,
        experience: parseInt(formData.experience) || 0,
        consultationFee: parseFloat(formData.consultationFee) || 0,
        documents: uploadedDocuments,
        verified: false,
        verificationStatus: 'pending'
      }

      const response = await fetch(`${getApiUrl()}/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorData),
      })

      if (response.ok) {
        // Profile submitted successfully, proceed to dashboard
        alert('Profile submitted successfully! Your documents have been securely uploaded and encrypted.')
        onComplete()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit profile')
      }
    } catch (error) {
      console.error('Error submitting doctor profile:', error)
      setError(error.message || 'Failed to submit profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Navigate directly to dashboard without confirmation
    onComplete()
  }

  return (
    <div className="doctor-details-form-container">
      <div className="form-header">
        <h1>Complete Your Doctor Profile</h1>
        <p>Please provide your professional information and upload verification documents</p>
        <button 
          type="button" 
          className="skip-button"
          onClick={handleSkip}
        >
          Skip for Now
        </button>
      </div>

      <form onSubmit={handleSubmit} className="doctor-details-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Full Name *</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label">Email *</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label">Phone Number *</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                required
              />
            </label>

            <label className="form-group full-width">
              <span className="form-label">Address</span>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Professional Information</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Specialization *</span>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Cardiologist, Pediatrician"
                className="form-input"
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label">Qualification *</span>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g., MBBS, MD"
                className="form-input"
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label">Years of Experience</span>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="0"
                className="form-input"
              />
            </label>

            <label className="form-group">
              <span className="form-label">License Number *</span>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="form-input"
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label">Consultation Fee ($)</span>
              <input
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="form-input"
              />
            </label>

            <label className="form-group full-width">
              <span className="form-label">Bio</span>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about yourself and your practice"
                className="form-input"
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Verification Documents</h2>
          <p className="section-description">
            Please upload copies of your medical license, degree certificates, and any other relevant documents.
          </p>
          
          <label className="file-upload-area">
            <input
              type="file"
              multiple
              onChange={handleDocumentUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="file-input"
            />
            <span className="material-symbols-outlined">upload_file</span>
            <span>Click to upload documents</span>
            <small>PDF, JPG, PNG (Max 10MB each)</small>
          </label>

          {documents.length > 0 && (
            <div className="documents-list">
              <h3>Uploaded Documents ({documents.length})</h3>
              {documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span className="material-symbols-outlined">description</span>
                  <span className="document-name">{doc.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="btn-remove"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Submitting...</span>
              </>
            ) : (
              'Submit for Verification'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorDetailsForm
