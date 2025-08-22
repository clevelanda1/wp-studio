/*
  # Fix User Signup RLS Policies

  1. Policy Changes
    - Drop the restrictive INSERT policy for users table
    - Add new policy allowing authenticated users to insert their own profile
    - Keep existing policies for SELECT and UPDATE operations

  2. Security
    - Users can only insert their own profile (id = auth.uid())
    - Business users can still manage all users via existing policies
    - Maintains data security while allowing signup
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Business users can manage all users" ON users;

-- Create separate policies for different operations
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Business users can manage all user data"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);