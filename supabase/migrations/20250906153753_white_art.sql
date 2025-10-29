/*
  # DeepInspect Database Schema

  1. Tables
    - `profiles` - User profile information
    - `tunnels` - Tunnel infrastructure data
    - `sections` - Tunnel sections for detailed inspection
    - `inspections` - Inspection records
    - `crack_features` - ML-detected crack features
    - `emergency_alerts` - Emergency alert system
    - `reports` - Generated reports

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Admin users can manage all data
    - Inspectors can only access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Inspector')) DEFAULT 'Inspector',
  created_at timestamptz DEFAULT now()
);

-- Create tunnels table
CREATE TABLE IF NOT EXISTS tunnels (
  tunnel_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  section_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tunnel_id uuid NOT NULL REFERENCES tunnels(tunnel_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  inspection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
  engineer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inspection_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  image_url text,
  defect_type text,
  severity text CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  confidence_score float,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Analyzed', 'Resolved')),
  created_at timestamptz DEFAULT now()
);

-- Create crack_features table
CREATE TABLE IF NOT EXISTS crack_features (
  feature_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(inspection_id) ON DELETE CASCADE,
  crack_density float8,
  avg_crack_length float8,
  max_crack_width float8,
  predicted_days_to_fix int4,
  created_at timestamptz DEFAULT now()
);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tunnel_id uuid REFERENCES tunnels(tunnel_id) ON DELETE SET NULL,
  message text NOT NULL,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'In Progress')),
  urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('inspection', 'defects', 'maintenance', 'billing')),
  date_range_start timestamptz,
  date_range_end timestamptz,
  file_url text,
  status text DEFAULT 'Generated' CHECK (status IN ('Generated', 'Downloaded', 'Archived')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tunnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crack_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Tunnels policies
CREATE POLICY "Authenticated users can read tunnels"
  ON tunnels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tunnels"
  ON tunnels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Sections policies
CREATE POLICY "Authenticated users can read sections"
  ON sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sections"
  ON sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Inspections policies
CREATE POLICY "Inspectors can read own inspections"
  ON inspections
  FOR SELECT
  TO authenticated
  USING (engineer_id = auth.uid());

CREATE POLICY "Inspectors can create inspections"
  ON inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (engineer_id = auth.uid());

CREATE POLICY "Inspectors can update own inspections"
  ON inspections
  FOR UPDATE
  TO authenticated
  USING (engineer_id = auth.uid());

CREATE POLICY "Admins can read all inspections"
  ON inspections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Crack features policies
CREATE POLICY "Users can read crack features for their inspections"
  ON crack_features
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspection_id = crack_features.inspection_id
      AND (engineer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'Admin'
      ))
    )
  );

CREATE POLICY "Users can insert crack features for their inspections"
  ON crack_features
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspection_id = crack_features.inspection_id
      AND engineer_id = auth.uid()
    )
  );

-- Emergency alerts policies
CREATE POLICY "Users can read all emergency alerts"
  ON emergency_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Inspectors can create emergency alerts"
  ON emergency_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Admins can manage emergency alerts"
  ON emergency_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Reports policies
CREATE POLICY "Users can read own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (generated_by = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Admins can read all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Insert sample data
INSERT INTO tunnels (tunnel_id, name, location) VALUES
  (gen_random_uuid(), 'Tunnel A', 'North Sector'),
  (gen_random_uuid(), 'Tunnel B', 'East Sector'),
  (gen_random_uuid(), 'Tunnel C', 'South Sector');

-- Insert sections for each tunnel
INSERT INTO sections (section_id, tunnel_id, name, description)
SELECT 
  gen_random_uuid(),
  t.tunnel_id,
  'Section ' || s.section_num,
  'Section ' || s.section_num || ' of ' || t.name
FROM tunnels t
CROSS JOIN (SELECT generate_series(1, 5) as section_num) s;