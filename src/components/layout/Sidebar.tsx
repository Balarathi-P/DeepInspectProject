import React from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Upload, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Users, 
  Search, 
  BarChart3,
  LogOut,
  Shield
} from 'lucide-react'

interface SidebarProps {
  currentView: string
  setCurrentView: (view: string) => void
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const { profile, signOut } = useAuthContext()

  const adminMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'inspections', icon: Search, label: 'All Inspections' },
    { id: 'users', icon: Users, label: 'Manage Users' },
    { id: 'alerts', icon: AlertTriangle, label: 'Emergency Alerts' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
  ]

  const inspectorMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'upload', icon: Upload, label: 'Upload Image' },
    { id: 'reports', icon: FileText, label: 'My Reports' },
  ]

  const menuItems = profile?.role === 'Admin' ? adminMenuItems : inspectorMenuItems

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl z-50">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Shield className="w-8 h-8 text-blue-300 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">DeepInspect</h2>
            <p className="text-blue-200 text-sm">{profile?.role} Portal</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-blue-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-200">Logged in as:</p>
          <p className="font-medium text-white">{profile?.full_name}</p>
          <p className="text-xs text-blue-300">{profile?.role}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  )
}