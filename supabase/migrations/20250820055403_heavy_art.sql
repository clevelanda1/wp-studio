/*
  # Fix Data Sharing Between Admin and Client Dashboards

  1. Database Functions
    - Create function to automatically link projects to clients
    - Create function to automatically link tasks to clients
    - Create function to automatically link contracts to clients
    - Create function to automatically link messages to clients

  2. Triggers
    - Auto-link projects when created
    - Auto-link tasks when created
    - Auto-link contracts when created
    - Auto-link messages when created

  3. RLS Policies
    - Ensure proper data visibility for clients
    - Ensure admins can manage all data

  4. Data Fixes
    - Fix existing unlinked data
*/

-- Function to automatically link projects to clients
CREATE OR REPLACE FUNCTION public.auto_link_project_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Ensure the project has a client_id
    IF NEW.client_id IS NULL THEN
        RAISE EXCEPTION 'Projects must be assigned to a client';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Function to automatically link tasks to clients
CREATE OR REPLACE FUNCTION public.auto_link_task_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    project_client_id uuid;
BEGIN
    -- If task has a project_id, get the client_id from the project
    IF NEW.project_id IS NOT NULL THEN
        SELECT client_id INTO project_client_id
        FROM public.projects
        WHERE id = NEW.project_id;
        
        -- Set the client_id on the task to match the project's client
        NEW.client_id := project_client_id;
    END IF;
    
    -- Ensure the task has a client_id (either from project or directly assigned)
    IF NEW.client_id IS NULL THEN
        RAISE EXCEPTION 'Tasks must be assigned to a client (either directly or through a project)';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Function to automatically link contracts to clients
CREATE OR REPLACE FUNCTION public.auto_link_contract_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    project_client_id uuid;
BEGIN
    -- If contract has a project_id, get the client_id from the project
    IF NEW.project_id IS NOT NULL THEN
        SELECT client_id INTO project_client_id
        FROM public.projects
        WHERE id = NEW.project_id;
        
        -- Set the client_id on the contract to match the project's client
        NEW.client_id := project_client_id;
    END IF;
    
    -- Ensure the contract has a client_id
    IF NEW.client_id IS NULL THEN
        RAISE EXCEPTION 'Contracts must be assigned to a client';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Function to automatically link messages to clients
CREATE OR REPLACE FUNCTION public.auto_link_message_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    project_client_id uuid;
BEGIN
    -- If message has a project_id, get the client_id from the project
    IF NEW.project_id IS NOT NULL THEN
        SELECT client_id INTO project_client_id
        FROM public.projects
        WHERE id = NEW.project_id;
        
        -- Set the client_id on the message to match the project's client
        NEW.client_id := project_client_id;
    END IF;
    
    -- Ensure the message has a client_id
    IF NEW.client_id IS NULL THEN
        RAISE EXCEPTION 'Messages must be assigned to a client';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS auto_link_project_to_client_trigger ON public.projects;
DROP TRIGGER IF EXISTS auto_link_task_to_client_trigger ON public.tasks;
DROP TRIGGER IF EXISTS auto_link_contract_to_client_trigger ON public.contracts;
DROP TRIGGER IF EXISTS auto_link_message_to_client_trigger ON public.messages;

-- Create triggers for automatic linking
CREATE TRIGGER auto_link_project_to_client_trigger
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_project_to_client();

CREATE TRIGGER auto_link_task_to_client_trigger
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_task_to_client();

CREATE TRIGGER auto_link_contract_to_client_trigger
    BEFORE INSERT OR UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_contract_to_client();

CREATE TRIGGER auto_link_message_to_client_trigger
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_message_to_client();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all RLS policies for consistency
DROP POLICY IF EXISTS "Business users can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own data via user_id" ON public.clients;
DROP POLICY IF EXISTS "Business users can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Business users can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Clients can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Business users can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Clients can manage their own messages" ON public.messages;
DROP POLICY IF EXISTS "Business users can manage all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can view their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable user registration" ON public.users;

-- Clients table policies
CREATE POLICY "Business users can manage all clients" ON public.clients
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('business_owner', 'team_member')));

CREATE POLICY "Clients can view their own data via user_id" ON public.clients
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Projects table policies
CREATE POLICY "Business users can manage all projects" ON public.projects
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('business_owner', 'team_member')));

CREATE POLICY "Clients can view their own projects" ON public.projects
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = projects.client_id AND clients.user_id = auth.uid()));

-- Tasks table policies
CREATE POLICY "Business users can manage all tasks" ON public.tasks
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('business_owner', 'team_member')));

CREATE POLICY "Clients can view their own tasks" ON public.tasks
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = tasks.client_id AND clients.user_id = auth.uid()));

-- Messages table policies
CREATE POLICY "Business users can manage all messages" ON public.messages
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('business_owner', 'team_member')));

CREATE POLICY "Clients can manage their own messages" ON public.messages
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = messages.client_id AND clients.user_id = auth.uid()));

-- Contracts table policies
CREATE POLICY "Business users can manage all contracts" ON public.contracts
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('business_owner', 'team_member')));

CREATE POLICY "Clients can view their own contracts" ON public.contracts
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = contracts.client_id AND clients.user_id = auth.uid()));

-- Users table policies
CREATE POLICY "Service role can manage all users" ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Enable user registration" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Fix existing data: Link tasks to clients through projects
DO $$
DECLARE
    task_record record;
    project_client_id uuid;
BEGIN
    RAISE NOTICE 'Fixing existing task-client links...';
    
    FOR task_record IN 
        SELECT t.id, t.project_id, t.client_id, p.client_id as project_client_id
        FROM public.tasks t
        LEFT JOIN public.projects p ON t.project_id = p.id
        WHERE t.client_id IS NULL AND t.project_id IS NOT NULL
    LOOP
        UPDATE public.tasks 
        SET client_id = task_record.project_client_id 
        WHERE id = task_record.id;
        
        RAISE NOTICE 'Linked task % to client %', task_record.id, task_record.project_client_id;
    END LOOP;
END
$$;

-- Fix existing data: Link contracts to clients through projects
DO $$
DECLARE
    contract_record record;
BEGIN
    RAISE NOTICE 'Fixing existing contract-client links...';
    
    FOR contract_record IN 
        SELECT c.id, c.project_id, c.client_id, p.client_id as project_client_id
        FROM public.contracts c
        LEFT JOIN public.projects p ON c.project_id = p.id
        WHERE c.client_id IS NULL AND c.project_id IS NOT NULL
    LOOP
        UPDATE public.contracts 
        SET client_id = contract_record.project_client_id 
        WHERE id = contract_record.id;
        
        RAISE NOTICE 'Linked contract % to client %', contract_record.id, contract_record.project_client_id;
    END LOOP;
END
$$;

-- Fix existing data: Link messages to clients through projects
DO $$
DECLARE
    message_record record;
BEGIN
    RAISE NOTICE 'Fixing existing message-client links...';
    
    FOR message_record IN 
        SELECT m.id, m.project_id, m.client_id, p.client_id as project_client_id
        FROM public.messages m
        LEFT JOIN public.projects p ON m.project_id = p.id
        WHERE m.client_id IS NULL AND m.project_id IS NOT NULL
    LOOP
        UPDATE public.messages 
        SET client_id = message_record.project_client_id 
        WHERE id = message_record.id;
        
        RAISE NOTICE 'Linked message % to client %', message_record.id, message_record.project_client_id;
    END LOOP;
END
$$;

-- Final verification
DO $$
DECLARE
    unlinked_count integer;
BEGIN
    -- Check for unlinked tasks
    SELECT COUNT(*) INTO unlinked_count
    FROM public.tasks
    WHERE client_id IS NULL;
    
    IF unlinked_count > 0 THEN
        RAISE WARNING 'Found % tasks without client_id', unlinked_count;
    ELSE
        RAISE NOTICE 'All tasks are properly linked to clients';
    END IF;
    
    -- Check for unlinked contracts
    SELECT COUNT(*) INTO unlinked_count
    FROM public.contracts
    WHERE client_id IS NULL;
    
    IF unlinked_count > 0 THEN
        RAISE WARNING 'Found % contracts without client_id', unlinked_count;
    ELSE
        RAISE NOTICE 'All contracts are properly linked to clients';
    END IF;
    
    -- Check for unlinked messages
    SELECT COUNT(*) INTO unlinked_count
    FROM public.messages
    WHERE client_id IS NULL;
    
    IF unlinked_count > 0 THEN
        RAISE WARNING 'Found % messages without client_id', unlinked_count;
    ELSE
        RAISE NOTICE 'All messages are properly linked to clients';
    END IF;
    
    RAISE NOTICE 'Data sharing fix completed successfully!';
END
$$;