import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  }

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:scale-105 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className={`text-2xl font-bold ${textColorClasses[color]}`}>{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}