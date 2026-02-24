import React from 'react'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} PharmaSpot. All rights reserved.</p>
        <p className="footer-tech">Built with React + Vite + Electron</p>
      </div>
    </footer>
  )
}

export default Footer
