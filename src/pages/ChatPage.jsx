import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/config'
import ChatComponent from '../components/ChatComponent'
import './ChatPage.css'

function ChatPage() {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/doctors/verified`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="chat-page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <h1>Chat with Doctors</h1>
        <p>Connect with verified healthcare professionals</p>
      </div>

      <div className="chat-layout">
        <div className="doctors-sidebar">
          <h2>Available Doctors</h2>
          {doctors.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">medical_services</span>
              <p>No doctors available</p>
            </div>
          ) : (
            <div className="doctors-list">
              {doctors.map(doctor => (
                <div
                  key={doctor._id}
                  className={`doctor-card ${selectedDoctor?._id === doctor._id ? 'active' : ''}`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="doctor-avatar">
                    <span className="material-symbols-outlined">medical_services</span>
                  </div>
                  <div className="doctor-info">
                    <h3>{doctor.name}</h3>
                    <p>{doctor.specialization}</p>
                    <small>{doctor.experience} years experience</small>
                  </div>
                  {doctor.verified && (
                    <span className="verified-badge" title="Verified">
                      <span className="material-symbols-outlined">verified</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-area">
          {selectedDoctor ? (
            <ChatComponent 
              userId={user._id}
              doctorId={typeof selectedDoctor.userId === 'object' ? selectedDoctor.userId._id : selectedDoctor.userId}
              userRole="user"
            />
          ) : (
            <div className="no-chat-selected">
              <span className="material-symbols-outlined">chat_bubble_outline</span>
              <h3>Select a doctor to start chatting</h3>
              <p>Choose a verified doctor from the list to begin your consultation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage
