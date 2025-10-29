import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase, Inspection } from '../../lib/supabase'
import { StatsCard } from './StatsCard'
import { Camera, AlertTriangle, Calendar, Clock, Upload, CalendarPlus, FileDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export function InspectorDashboard() {
  const { profile } = useAuthContext()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [stats, setStats] = useState({
    totalInspections: 0,
    defectsFound: 0,
    scheduled: 0,
    overdue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInspections()
  }, [profile])

  const fetchInspections = async () => {
    try {
      if (!profile) return

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          sections!inner(
            name,
            tunnels!inner(name)
          )
        `)
        .eq('engineer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setInspections(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const defects = data?.filter(i => i.defect_type).length || 0
      const pending = data?.filter(i => i.status === 'Pending').length || 0
      const overdue = data?.filter(i => {
        const inspectionDate = new Date(i.inspection_date)
        const today = new Date()
        const diffDays = Math.floor((today.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays > 7 && i.status === 'Pending'
      }).length || 0

      setStats({
        totalInspections: total,
        defectsFound: defects,
        scheduled: pending,
        overdue: overdue
      })

    } catch (error: any) {
      toast.error('Error fetching inspections')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const trendData = [
    { month: 'Jan', defects: 5 },
    { month: 'Feb', defects: 8 },
    { month: 'Mar', defects: 3 },
    { month: 'Apr', defects: 12 },
    { month: 'May', defects: 7 },
    { month: 'Jun', defects: 4 },
  ]

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
        <h1 className="text-3xl font-bold text-blue-900">Inspector Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            2 Alerts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Inspections"
          value={stats.totalInspections}
          icon={Camera}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Defects Found"
          value={stats.defectsFound}
          icon={AlertTriangle}
          color="orange"
          trend={{ value: -5, isPositive: false }}
        />
        <StatsCard
          title="Scheduled"
          value={stats.scheduled}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={Clock}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recent Inspections</h3>
          <div className="space-y-3">
            {inspections.length > 0 ? (
              inspections.slice(0, 5).map((inspection: any) => (
                <div
                  key={inspection.inspection_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {inspection.sections?.tunnels?.name} - {inspection.sections?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(inspection.inspection_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {inspection.severity && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(inspection.severity)}`}>
                        {inspection.severity}
                      </span>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Status: {inspection.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No inspections yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Inspection Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="defects" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors transform hover:scale-105">
            <Upload className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Upload Image</span>
          </button>
          <button className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors transform hover:scale-105">
            <FileDown className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  )
}