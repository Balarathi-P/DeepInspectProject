import React, { useState, useEffect } from 'react'
import { supabase, EmergencyAlert, Inspection, Profile } from '../../lib/supabase'
import { StatsCard } from './StatsCard'
import { Users, Search, AlertTriangle, Wrench, Bell, Circle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'

export function AdminDashboard() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [stats, setStats] = useState({
    totalInspectors: 0,
    totalInspections: 0,
    criticalDefects: 0,
    pendingMaintenance: 0
  })
  const [systemStatus] = useState({
    mlService: 'Online',
    database: 'Connected',
    storage: 'Available',
    notifications: 'Limited'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch emergency alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('emergency_alerts')
        .select(`
          *,
          profiles!inner(full_name),
          tunnels(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (alertsError) throw alertsError
      setAlerts(alertsData || [])

      // Fetch stats
      const [inspectorsResult, inspectionsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('inspections').select('*', { count: 'exact' })
      ])

      const { data: criticalInspections } = await supabase
        .from('inspections')
        .select('*')
        .eq('severity', 'Critical')

      setStats({
        totalInspectors: inspectorsResult.count || 0,
        totalInspections: inspectionsResult.count || 0,
        criticalDefects: criticalInspections?.length || 0,
        pendingMaintenance: Math.floor(Math.random() * 10) + 1 // Mock data
      })

    } catch (error: any) {
      toast.error('Error fetching dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const defectData = [
    { name: 'Critical', value: 3, color: '#ef4444' },
    { name: 'High', value: 7, color: '#f97316' },
    { name: 'Medium', value: 12, color: '#eab308' },
    { name: 'Low', value: 8, color: '#22c55e' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
      case 'Connected':
      case 'Available':
        return 'text-green-600'
      case 'Limited':
        return 'text-yellow-600'
      default:
        return 'text-red-600'
    }
  }

  const getAlertBorderColor = (urgent: boolean) => {
    return urgent ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Administrator Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm animate-pulse">
            <Bell className="w-4 h-4 inline mr-1" />
            {alerts.filter(alert => alert.urgent).length} Urgent Alerts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Inspectors"
          value={stats.totalInspectors}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Inspections"
          value={stats.totalInspections}
          icon={Search}
          color="green"
        />
        <StatsCard
          title="Critical Defects"
          value={stats.criticalDefects}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Pending Maintenance"
          value={stats.pendingMaintenance}
          icon={Wrench}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Emergency Alerts</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <div
                  key={alert.alert_id}
                  className={`p-3 rounded-lg border-l-4 ${getAlertBorderColor(alert.urgent)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {alert.tunnels?.name || 'Unknown Tunnel'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {alert.profiles?.full_name}
                      </p>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No alerts</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Defect Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {defectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">System Status</h3>
          <div className="space-y-4">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="flex justify-between items-center">
                <span className="text-sm capitalize">
                  {service.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`flex items-center ${getStatusColor(status)}`}>
                  <Circle className="w-2 h-2 mr-2 fill-current" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">New inspection uploaded</p>
                <p className="text-xs text-gray-600">John Doe - Tunnel A - 5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Critical defect detected</p>
                <p className="text-xs text-gray-600">ML Analysis - Tunnel C - 8 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">New inspector registered</p>
                <p className="text-xs text-gray-600">Sarah Wilson - 12 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Maintenance Schedule</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Tunnel A - Section 2</p>
                <p className="text-sm text-gray-600">Crack repair scheduled</p>
              </div>
              <span className="text-sm text-blue-600">Today</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium">Tunnel B - Section 5</p>
                <p className="text-sm text-gray-600">Water seepage fix</p>
              </div>
              <span className="text-sm text-yellow-600">Tomorrow</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium">Tunnel C - Section 1</p>
                <p className="text-sm text-gray-600">Structural reinforcement</p>
              </div>
              <span className="text-sm text-red-600">Overdue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}