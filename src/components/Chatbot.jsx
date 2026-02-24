import React, { useState, useEffect, useRef } from 'react'
import { getApiUrl } from '../utils/config'
import './Chatbot.css'

const WELCOME_MESSAGE = 'Hello! I\'m your pharmacy assistant. I can help you with stock queries, expiry checks, sales reports, and demand forecasts. How can I assist you today?'

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [quickActions, setQuickActions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadQuickActions()
      scrollToBottom()
    }
  }, [isOpen, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadQuickActions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/chatbot/quick-actions`)
      const actions = await response.json()
      setQuickActions(actions)
    } catch (error) {
      console.error('Error loading quick actions:', error)
    }
  }

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return

    // Handle special commands
    const command = messageText.toLowerCase().trim()
    
    if (command === 'clear') {
      setMessages([
        {
          type: 'bot',
          text: 'Chat cleared! How can I assist you?',
          timestamp: new Date()
        }
      ])
      setInput('')
      return
    }
    
    if (command === 'stop') {
      setMessages([
        {
          type: 'bot',
          text: WELCOME_MESSAGE,
          timestamp: new Date()
        }
      ])
      setInput('')
      return
    }

    const userMessage = {
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: messageText }),
      })

      const data = await response.json()

      const botMessage = {
        type: 'bot',
        text: data.answer,
        data: data.data,
        suggestions: data.suggestions,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action) => {
    sendMessage(action.query)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Chatbot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>🤖 Pharmacy Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  {message.data && Array.isArray(message.data) && (
                    <div className="message-data">
                      {message.data.slice(0, 3).map((item, i) => (
                        <div key={i} className="data-item">
                          {item.name && <span>📦 {item.name}</span>}
                          {item.stock !== undefined && <span> - Stock: {item.stock}</span>}
                          {item.productName && <span>📦 {item.productName}</span>}
                          {item.expiryDate && (
                            <span> - Expiry: {new Date(item.expiryDate).toLocaleDateString()}</span>
                          )}
                          {item.daysUntilExpiry !== undefined && (
                            <span> - ({item.daysUntilExpiry} days left)</span>
                          )}
                          {item.sku && <span> - SKU: {item.sku}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="message-suggestions">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          className="suggestion-btn"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {quickActions.length > 0 && messages.length <= 2 && (
            <div className="quick-actions">
              <p>Quick Actions:</p>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="chatbot-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
