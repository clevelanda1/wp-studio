/*
  # Create returns table for tracking project returns

  1. New Tables
    - `returns`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `client_id` (uuid, foreign key to clients)
      - `item` (text, name of returned item)
      - `reason` (text, reason for return)
      - `status` (text, return status)
      - `amount` (numeric, optional return amount)
      - `return_date` (date, when item was returned)
      - `processed_date` (date, when return was processed)
      - `images` (text array, return images)
      - `notes` (text, additional notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `returns` table
    - Add policies for business users to manage all returns
    - Add policies for clients to view their own returns

  3. Indexes
    - Add index on project_id for efficient queries
    - Add index on client_id for efficient queries
*/

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  item text NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  amount numeric,
  return_date date NOT NULL,
  processed_date date,
  images text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_returns_project_id ON returns(project_id);
CREATE INDEX IF NOT EXISTS idx_returns_client_id ON returns(client_id);

-- RLS Policies
CREATE POLICY "Business users can manage all returns"
  ON returns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own returns"
  ON returns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = returns.client_id 
      AND clients.user_id = auth.uid()
    )
  );