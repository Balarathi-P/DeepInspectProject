import React, { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { AuthForm } from './components/auth/AuthForm'
import { Sidebar } from './components/layout/Sidebar'
import { InspectorDashboard } from './components/dashboard/InspectorDashboard'
import { AdminDashboard } from './components/dashboard/AdminDashboard'
import { ImageUpload } from './components/upload/ImageUpload'
import { Emergency } from './components/emergency/Emergency'
import { Toaster } from 'react-hot-toast'

function AppContent() {
  const { user, profile, loading } = useAuthContext()
  const [currentView, setCurrentView] = useState('dashboard')

  const renderContent = () => {
    if (!user || !profile) return null

    switch (currentView) {
      case 'dashboard':
        return profile.role === 'Admin' ? <AdminDashboard /> : <InspectorDashboard />
      case 'upload':
        return <ImageUpload />
      case 'reports':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 text-lg">Reports section is under development</p>
          </div>
        )
      case 'inspections':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg">All Inspections view is under development</p>
          </div>
        )
      case 'users':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 text-lg">User management is under development</p>
          </div>
        )
      case 'alerts':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚨</div>
            <p className="text-gray-600 text-lg">Alert management is under development</p>
          </div>
        )
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-gray-600 text-lg">This section is under development</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="ml-64 p-6">
        {renderContent()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}