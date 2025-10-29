import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase, EmergencyAlert, Tunnel } from '../../lib/supabase'
import { AlertTriangle, Phone, Send, CheckCircle, Clock, Eye, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export function Emergency() {
  const { profile } = useAuthContext()
  const [alertMessage, setAlertMessage] = useState('')
  const [selectedTunnel, setSelectedTunnel] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [alertSent, setAlertSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tunnels, setTunnels] = useState<Tunnel[]>([])
  const [alertHistory, setAlertHistory] = useState<EmergencyAlert[]>([])

  useEffect(() => {
    fetchTunnels()
    fetchAlertHistory()
  }, [profile])

  const fetchTunnels = async () => {
    try {
      const { data, error } = await supabase
        .from('tunnels')
        .select('*')
        .order('name')

      if (error) throw error
      setTunnels(data || [])
    } catch (error) {
      console.error('Error fetching tunnels:', error)
    }
  }

  const fetchAlertHistory = async () => {
    try {
      if (!profile) return

      const { data, error } = await supabase
        .from('emergency_alerts')
        .select(`
          *,
          tunnels(name)
        `)
        .eq('inspector_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlertHistory(data || [])
    } catch (error) {
      console.error('Error fetching alert history:', error)
    }
  }

  const sendEmergencyAlert = async () => {
    if (!alertMessage.trim() || !profile) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          inspector_id: profile.id,
          tunnel_id: selectedTunnel || null,
          message: alertMessage.trim(),
          urgent: urgent,
          status: 'Active'
        })
        .select(`
          *,
          tunnels(name)
        `)
        .single()

      if (error) throw error

      setAlertHistory(prev => [data, ...prev])
      setAlertMessage('')
      setSelectedTunnel('')
      setUrgent(false)
      setAlertSent(true)
      
      toast.success('Emergency alert sent successfully!')
      
      setTimeout(() => setAlertSent(false), 3000)

    } catch (error: any) {
      toast.error('Failed to send alert: ' + error.message)
      console.error('Error sending alert:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const emergencyContacts = [
    {
      name: 'Control Center',
      description: '24/7 Emergency Response',
      color: 'bg-blue-600 hover:bg-blue-700',
      phone: '+1-555-CONTROL'
    },
    {
      name: 'Safety Team',
      description: 'Emergency Evacuation',
      color: 'bg-red-600 hover:bg-red-700',
      phone: '+1-555-SAFETY'
    },
    {
      name: 'Maintenance Team',
      description: 'Technical Support',
      color: 'bg-green-600 hover:bg-green-700',
      phone: '+1-555-MAINT'
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Emergency Alert System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Send Emergency Alert
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tunnel Location (Optional)
              </label>
              <select
                value={selectedTunnel}
                onChange={(e) => setSelectedTunnel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select tunnel (optional)</option>
                {tunnels.map((tunnel) => (
                  <option key={tunnel.tunnel_id} value={tunnel.tunnel_id}>
                    {tunnel.name} - {tunnel.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Description *
              </label>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Describe the emergency situation in detail..."
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="urgent"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="urgent" className="ml-2 block text-sm text-gray-900">
                Mark as urgent (immediate response required)
              </label>
            </div>
            
            <button
              onClick={sendEmergencyAlert}
              disabled={!alertMessage.trim() || loading}
              className={`w-full text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                urgent
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Alert...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  SEND EMERGENCY ALERT
                </div>
              )}
            </button>
            
            {alertSent && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Emergency alert sent successfully!
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Emergency Contacts</h3>
          
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.description}</p>
                  <p className="text-xs text-gray-500">{contact.phone}</p>
                </div>
                <button className={`${contact.color} text-white px-4 py-2 rounded text-sm transition-colors flex items-center`}>
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Emergency Procedures</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure personal safety first</li>
              <li>• Evacuate if necessary</li>
              <li>• Document the situation with photos if safe</li>
              <li>• Contact emergency services if immediate danger</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Alert History</h3>
        
        {alertHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Location</th>
                  <th className="text-left py-3 px-4 font-semibold">Message</th>
                  <th className="text-left py-3 px-4 font-semibold">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertHistory.map((alert: any) => (
                  <tr key={alert.alert_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {alert.tunnels?.name || 'Not specified'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {alert.message}
                    </td>
                    <td className="py-3 px-4">
                      {alert.urgent ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Urgent
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {alert.status === 'Active' && (
                          <button className="text-green-600 hover:text-green-800 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No emergency alerts sent yet</p>
          </div>
        )}
      </div>
    </div>
  )
}