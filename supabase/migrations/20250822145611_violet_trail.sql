/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `client_id` (uuid, foreign key to clients)
      - `title` (text)
      - `description` (text)
      - `items` (jsonb array for expense items)
      - `total_amount` (numeric)
      - `expense_date` (date)
      - `category` (text)
      - `receipt_image` (text, optional)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for business users to manage all expenses
    - Add policies for clients to view their own expenses

  3. Indexes
    - Add indexes on project_id and client_id for better query performance
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  items jsonb DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL,
  category text DEFAULT 'materials',
  receipt_image text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);

-- RLS Policies
CREATE POLICY "Business users can manage all expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = expenses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Add constraint to ensure items is an array
ALTER TABLE expenses ADD CONSTRAINT expenses_items_is_array 
  CHECK (jsonb_typeof(items) = 'array');

-- Add check constraint for category
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
  CHECK (category IN ('materials', 'labor', 'transportation', 'permits', 'other'));