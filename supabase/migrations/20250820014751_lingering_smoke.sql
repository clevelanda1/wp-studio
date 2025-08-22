/*
  # Fix RLS policy recursion for users table

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are trying to query the users table from within users table policies
    - This prevents authentication from working properly

  2. Solution
    - Drop all existing problematic policies
    - Create simple, direct policies using only auth.uid()
    - Avoid any subqueries that reference the users table itself

  3. New Policies
    - Users can view their own profile (using auth.uid() directly)
    - Users can update their own profile (using auth.uid() directly)
    - Enable user registration during signup
*/

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Business users can manage all user data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable user registration" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
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

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);