import React, { useState, useEffect, useRef } from 'react'
import { getApiUrl } from '../utils/config'
import './ChatComponent.css'

function ChatComponent({ userId, doctorId, userRole }) {
  const [chat, setChat] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadChat()
    const interval = setInterval(loadChat, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [userId, doctorId])

  useEffect(() => {
    scrollToBottom()
  }, [chat?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChat = async () => {
    try {
      // Ensure we have valid IDs before making the request
      if (!userId || !doctorId) {
        console.error('Missing userId or doctorId')
        return
      }
      
      const response = await fetch(`${getApiUrl()}/chats/conversation/${userId}/${doctorId}`)
      if (response.ok) {
        const chatData = await response.json()
        setChat(chatData)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const response = await fetch(`${getApiUrl()}/chats/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          doctorId,
          senderId: userRole === 'doctor' ? userId : userId,
          senderRole: userRole === 'doctor' ? 'doctor' : 'user',
          message: message.trim()
        }),
      })

      if (response.ok) {
        setMessage('')
        await loadChat()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="chat-component">
      <div className="chat-header">
        <div className="chat-participant">
          <span className="material-symbols-outlined">
            {userRole === 'doctor' ? 'person' : 'medical_services'}
          </span>
          <div>
            <h3>
              {userRole === 'doctor' 
                ? chat?.userId?.fullname || chat?.userId?.username 
                : chat?.doctorId?.fullname || chat?.doctorId?.username}
            </h3>
            <span className="status-indicator">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {chat?.messages && chat.messages.length === 0 ? (
          <div className="empty-chat">
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {chat?.messages?.map((msg, index) => {
              const isOwnMessage = userRole === 'doctor' 
                ? msg.senderRole === 'doctor' 
                : msg.senderRole === 'user'
              
              return (
                <div 
                  key={index} 
                  className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          disabled={sending}
        />
        <button type="submit" className="send-button" disabled={sending || !message.trim()}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  )
}

export default ChatComponent
