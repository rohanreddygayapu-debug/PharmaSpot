import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSwipeBack } from '../hooks/useSwipeBack'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import POSView from '../components/POSView'
import TransactionsView from '../components/TransactionsView'
import ProductsPage from './ProductsPage'
import CustomersPage from './CustomersPage'
import DoctorsPage from './DoctorsPage'
import PatientsPage from './PatientsPage'
import DrugsPage from './DrugsPage'
import InsurancePage from './InsurancePage'
import PrescriptionsPage from './PrescriptionsPage'
import SuppliersPage from './SuppliersPage'
import AdminDashboard from './AdminDashboard'
import WorkerDashboard from './WorkerDashboard'
import CustomerDashboard from './CustomerDashboard'
import DoctorDashboard from './DoctorDashboard'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'
import Chatbot from '../components/Chatbot'
import './Dashboard.css'

function Dashboard() {
  const [activeView, setActiveView] = useState('home')
  const [viewHistory, setViewHistory] = useState(['home'])
  const { user } = useAuth()

  const handleBackNavigation = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory]
      newHistory.pop() // Remove current view
      const previousView = newHistory[newHistory.length - 1]
      setViewHistory(newHistory)
      setActiveView(previousView)
    }
  }

  const handleSetActiveView = (view) => {
    if (view !== activeView) {
      setViewHistory([...viewHistory, view])
      setActiveView(view)
    }
  }

  // Enable swipe back gesture
  useSwipeBack(handleBackNavigation, {
    enabled: activeView !== 'home'
  })

  // Check if user has customer or user role and show customer dashboard
  if (user?.role === 'customer' || user?.role === 'user') {
    return <CustomerDashboard />
  }

  // Check if user has doctor role and show doctor dashboard
  if (user?.role === 'doctor') {
    return <DoctorDashboard />
  }

  // Check if user has admin role and show admin views
  if (user?.role === 'admin') {
    const renderAdminView = () => {
      switch (activeView) {
        case 'reports':
          return <ReportsPage />
        case 'settings':
          return <SettingsPage />
        case 'pos':
          return <POSView />
        case 'transactions':
          return <TransactionsView />
        case 'products':
          return <ProductsPage />
        case 'customers':
          return <CustomersPage />
        case 'doctors':
          return <DoctorsPage />
        case 'patients':
          return <PatientsPage />
        case 'drugs':
          return <DrugsPage />
        case 'insurance':
          return <InsurancePage />
        case 'prescriptions':
          return <PrescriptionsPage />
        case 'suppliers':
          return <SuppliersPage />
        case 'home':
        default:
          return <AdminDashboard setActiveView={handleSetActiveView} />
      }
    }

    return (
      <div className="dashboard">
        <Navbar activeView={activeView} setActiveView={handleSetActiveView} userRole="admin" />
        <div className="dashboard-content">
          {renderAdminView()}
        </div>
        <Chatbot />
        <Footer />
      </div>
    )
  }

  // Check if user has worker role
  if (user?.role === 'worker') {
    const renderWorkerView = () => {
      switch (activeView) {
        case 'pos':
          return <POSView />
        case 'transactions':
          return <TransactionsView />
        case 'home':
        default:
          return <WorkerDashboard />
      }
    }

    return (
      <div className="dashboard">
        <Navbar activeView={activeView} setActiveView={handleSetActiveView} userRole="worker" />
        {activeView !== 'home' && (
          <button className="back-button" onClick={handleBackNavigation}>
            ← Back
          </button>
        )}
        <div className="dashboard-content">
          {renderWorkerView()}
        </div>
        <Chatbot />
        <Footer />
      </div>
    )
  }

  // Default fallback - should not reach here if roles are properly set
  return (
    <div className="dashboard">
      <Navbar activeView={activeView} setActiveView={handleSetActiveView} userRole="user" />
      {activeView !== 'home' && (
        <button className="back-button" onClick={handleBackNavigation}>
          ← Back
        </button>
      )}
      <div className="dashboard-content">
        <div className="home-view">
          <div className="welcome-banner">
            <h1>Welcome to PharmaSpot</h1>
            <p>Your account is being set up</p>
          </div>
          <div className="info-message">
            <p>👋 Hello! Please wait while we set up your account.</p>
            <p>If this persists, please contact the administrator.</p>
          </div>
        </div>
      </div>
      <Chatbot />
      <Footer />
    </div>
  )
}

export default Dashboard
