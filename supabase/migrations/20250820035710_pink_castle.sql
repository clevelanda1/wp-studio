/*
  # Fix data sharing between admin and client users

  1. Security Updates
    - Update RLS policies to use the correct user_id relationship
    - Ensure clients can view their own data via direct user_id link
    - Ensure projects are visible to clients through the client relationship

  2. Data Consistency
    - Ensure proper relationships between users, clients, and projects
    - Fix any existing data inconsistencies
*/

-- Update clients RLS policy to use direct user_id relationship
DROP POLICY IF EXISTS "Clients can view their own data via user_id" ON clients;

CREATE POLICY "Clients can view their own data via user_id"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update projects RLS policy to work with the client relationship
DROP POLICY IF EXISTS "Clients can view their own projects" ON projects;

CREATE POLICY "Clients can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = projects.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Update tasks RLS policy
DROP POLICY IF EXISTS "Clients can view their own tasks" ON tasks;

CREATE POLICY "Clients can view their own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = tasks.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Update messages RLS policy
DROP POLICY IF EXISTS "Clients can manage their own messages" ON messages;

CREATE POLICY "Clients can manage their own messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = messages.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Update contracts RLS policy
DROP POLICY IF EXISTS "Clients can view their own contracts" ON contracts;

CREATE POLICY "Clients can view their own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = contracts.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Create a function to automatically link new users to existing client records by email
CREATE OR REPLACE FUNCTION link_user_to_existing_client()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new user with client role, try to link to existing client record
  IF NEW.role = 'client' THEN
    -- Check if there's an existing client with the same email but no user_id
    UPDATE clients 
    SET user_id = NEW.id 
    WHERE email = NEW.email 
    AND user_id IS NULL;
    
    -- If no existing client was found, create a new one
    IF NOT FOUND THEN
      INSERT INTO clients (
        user_id,
        name,
        email,
        phone,
        status,
        budget,
        notes,
        lead_source
      ) VALUES (
        NEW.id,
        NEW.name,
        NEW.email,
        '(000) 000-0000', -- Default phone
        'inquiry',
        0,
        'Auto-created from user signup',
        'Website'
      );
    END IF;
    
    -- Update the user record with the client_id
    UPDATE users 
    SET client_id = (
      SELECT id FROM clients WHERE user_id = NEW.id
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION link_user_to_existing_client();

-- Also create a trigger for updates (in case role changes)
DROP TRIGGER IF EXISTS on_user_role_updated ON users;
CREATE TRIGGER on_user_role_updated
  AFTER UPDATE OF role ON users
  FOR EACH ROW 
  WHEN (NEW.role = 'client' AND OLD.role != 'client')
  EXECUTE FUNCTION link_user_to_existing_client();