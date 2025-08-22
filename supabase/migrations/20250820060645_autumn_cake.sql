/*
  # Fix User-Client Linking Issue
  
  This script identifies and fixes the mismatch between user IDs and client IDs
  by properly linking users to their corresponding client records based on email.
*/

-- First, let's see what we're working with
DO $$
BEGIN
    RAISE NOTICE 'Current user-client relationships:';
    RAISE NOTICE 'Users table:';
    PERFORM u.id, u.email, u.role, u.client_id FROM users u;
    
    RAISE NOTICE 'Clients table:';
    PERFORM c.id, c.email, c.user_id FROM clients c;
END $$;

-- Fix the user-client linking by matching emails
DO $$
DECLARE
    user_record record;
    client_record record;
    fixed_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting user-client linking fix...';
    
    -- For each user with role 'client', find matching client by email
    FOR user_record IN 
        SELECT id, email, name, client_id 
        FROM users 
        WHERE role = 'client'
    LOOP
        -- Find the client record with matching email
        SELECT id, name, user_id INTO client_record
        FROM clients 
        WHERE email = user_record.email
        LIMIT 1;
        
        IF FOUND THEN
            -- Update the user's client_id to point to the correct client
            UPDATE users 
            SET client_id = client_record.id 
            WHERE id = user_record.id;
            
            -- Update the client's user_id to point to the correct user
            UPDATE clients 
            SET user_id = user_record.id 
            WHERE id = client_record.id;
            
            fixed_count := fixed_count + 1;
            
            RAISE NOTICE 'Fixed linking: User % (%) <-> Client % (%)', 
                user_record.email, user_record.id, client_record.name, client_record.id;
        ELSE
            RAISE NOTICE 'No matching client found for user: % (%)', user_record.email, user_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % user-client relationships', fixed_count;
END $$;

-- Verify the fix
DO $$
DECLARE
    user_record record;
    client_record record;
BEGIN
    RAISE NOTICE 'Verification - Current user-client relationships after fix:';
    
    FOR user_record IN 
        SELECT u.id as user_id, u.email, u.role, u.client_id, c.id as actual_client_id, c.name as client_name
        FROM users u
        LEFT JOIN clients c ON u.client_id = c.id
        WHERE u.role = 'client'
    LOOP
        RAISE NOTICE 'User: % (%) -> Client: % (%)', 
            user_record.email, user_record.user_id, user_record.client_name, user_record.actual_client_id;
    END LOOP;
END $$;

-- Also check for any orphaned data
DO $$
BEGIN
    RAISE NOTICE 'Checking for orphaned records...';
    
    -- Users without matching clients
    PERFORM u.id, u.email
    FROM users u
    LEFT JOIN clients c ON u.client_id = c.id
    WHERE u.role = 'client' AND c.id IS NULL;
    
    -- Clients without matching users
    PERFORM c.id, c.email, c.name
    FROM clients c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE u.id IS NULL;
    
    RAISE NOTICE 'Orphaned record check completed.';
END $$;