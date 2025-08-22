/*
  # Initial Database Schema for Proof & Pattern CRM

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `status` (text)
      - `budget` (numeric)
      - `move_in_date` (date)
      - `reveal_date` (date)
      - `style_preferences` (text array)
      - `notes` (text)
      - `lead_source` (text)
      - `avatar` (text)
      - `address` (text)
      - `created_at` (timestamptz)

    - `projects`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `name` (text)
      - `status` (text)
      - `budget` (numeric)
      - `spent` (numeric)
      - `start_date` (date)
      - `expected_completion` (date)
      - `description` (text)
      - `rooms` (text array)
      - `images` (text array)
      - `progress` (integer)
      - `created_at` (timestamptz)

    - `tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `due_date` (date)
      - `assigned_to` (text)
      - `category` (text)
      - `created_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `is_project_message` (boolean)
      - `sender_id` (text)
      - `sender_name` (text)
      - `content` (text)
      - `timestamp` (timestamptz)
      - `attachments` (text array)
      - `read` (boolean)

    - `contracts`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `project_id` (uuid, foreign key)
      - `title` (text)
      - `type` (text)
      - `status` (text)
      - `file_url` (text)
      - `file_name` (text)
      - `created_at` (timestamptz)
      - `sent_at` (timestamptz)
      - `signed_at` (timestamptz)
      - `signed_by` (text)
      - `value` (numeric)
      - `description` (text)
      - `version` (integer)

    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `avatar` (text)
      - `permissions` (text array)
      - `client_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'inquiry',
  budget numeric DEFAULT 0,
  move_in_date date,
  reveal_date date,
  style_preferences text[] DEFAULT '{}',
  notes text DEFAULT '',
  lead_source text DEFAULT '',
  avatar text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'consultation',
  budget numeric DEFAULT 0,
  spent numeric DEFAULT 0,
  start_date date NOT NULL,
  expected_completion date NOT NULL,
  description text DEFAULT '',
  rooms text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  due_date date NOT NULL,
  assigned_to text,
  category text NOT NULL DEFAULT 'design',
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  is_project_message boolean DEFAULT false,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  attachments text[] DEFAULT '{}',
  read boolean DEFAULT false
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'proposal',
  status text NOT NULL DEFAULT 'draft',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  signed_at timestamptz,
  signed_by text,
  value numeric,
  description text DEFAULT '',
  version integer DEFAULT 1
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'client',
  avatar text,
  permissions text[] DEFAULT '{}',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Business users can manage all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.client_id = clients.id
    )
  );

-- Create policies for projects table
CREATE POLICY "Business users can manage all projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.client_id = projects.client_id
    )
  );

-- Create policies for tasks table
CREATE POLICY "Business users can manage all tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.client_id = tasks.client_id
    )
  );

-- Create policies for messages table
CREATE POLICY "Business users can manage all messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can manage their own messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.client_id = messages.client_id
    )
  );

-- Create policies for contracts table
CREATE POLICY "Business users can manage all contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('business_owner', 'team_member')
    )
  );

CREATE POLICY "Clients can view their own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.client_id = contracts.client_id
    )
  );

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (users.id::text = auth.uid()::text);

CREATE POLICY "Business users can manage all users"
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