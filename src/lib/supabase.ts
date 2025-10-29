import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  role: 'Admin' | 'Inspector'
  created_at: string
}

export type Tunnel = {
  tunnel_id: string
  name: string
  location: string
  created_at: string
}

export type Section = {
  section_id: string
  tunnel_id: string
  name: string
  description: string
  created_at: string
}

export type Inspection = {
  inspection_id: string
  section_id: string
  engineer_id: string
  inspection_date: string
  notes?: string
  image_url?: string
  defect_type?: string
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'
  confidence_score?: number
  status: 'Pending' | 'Analyzed' | 'Resolved'
  created_at: string
}

export type CrackFeature = {
  feature_id: string
  inspection_id: string
  crack_density?: number
  avg_crack_length?: number
  max_crack_width?: number
  predicted_days_to_fix?: number
  created_at: string
}

export type EmergencyAlert = {
  alert_id: string
  inspector_id: string
  tunnel_id?: string
  message: string
  status: 'Active' | 'Resolved' | 'In Progress'
  urgent: boolean
  created_at: string
}

export type Report = {
  report_id: string
  generated_by: string
  report_type: 'inspection' | 'defects' | 'maintenance' | 'billing'
  date_range_start?: string
  date_range_end?: string
  file_url?: string
  status: 'Generated' | 'Downloaded' | 'Archived'
  created_at: string
}