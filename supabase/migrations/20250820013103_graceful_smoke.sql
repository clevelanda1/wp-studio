/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are trying to query the users table from within users table policies
    
  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that don't cause recursion
    - Use auth.uid() directly instead of querying users table
    
  3. New Policies
    - Users can view and update their own profile using auth.uid()
    - Enable insert for new user registration
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Business users can manage all user data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);