/*
  # Add project files table for enhanced file management

  1. New Tables
    - `project_files`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `client_id` (uuid, foreign key to clients)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `room` (text, nullable)
      - `description` (text, nullable)
      - `is_visionboard` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `project_files` table
    - Add policies for business users and clients to manage their files

  3. Changes
    - Enhanced file management with metadata
    - Support for visionboard categorization
    - Room-based file organization
*/

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  room text,
  description text DEFAULT '',
  is_visionboard boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users can manage all project files"
  ON project_files
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('business_owner', 'team_member')
  ));

CREATE POLICY "Clients can view their own project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = project_files.client_id
    AND clients.user_id = auth.uid()
  ));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_client_id ON project_files(client_id);
CREATE INDEX IF NOT EXISTS idx_project_files_is_visionboard ON project_files(is_visionboard);
CREATE INDEX IF NOT EXISTS idx_project_files_room ON project_files(room);