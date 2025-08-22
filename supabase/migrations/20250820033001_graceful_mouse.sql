/*
  # Add user_id column to clients table

  1. Schema Changes
    - Add `user_id` column to `clients` table
    - Set up foreign key relationship to `users` table
    - Add unique constraint to ensure one-to-one relationship
    - Backfill existing data where possible

  2. Security
    - Update RLS policies to use new user_id relationship
    - Maintain existing security model

  3. Data Migration
    - Attempt to link existing clients to users by email
    - Handle cases where no matching user exists
*/

-- Add user_id column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_user_id_fkey'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add unique constraint to ensure one-to-one relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_user_id_unique'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_user_id_unique 
    UNIQUE (user_id);
  END IF;
END $$;

-- Backfill existing data by matching emails
UPDATE clients 
SET user_id = users.id
FROM users 
WHERE clients.email = users.email 
  AND users.role = 'client'
  AND clients.user_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Update RLS policies to use the new user_id relationship
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
DROP POLICY IF EXISTS "Business users can manage all clients" ON clients;

-- New policy for clients to view their own data using user_id
CREATE POLICY "Clients can view their own data via user_id"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- New policy for business users to manage all clients
CREATE POLICY "Business users can manage all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('business_owner', 'team_member')
    )
  );