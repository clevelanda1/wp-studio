/*
  # Add visible_to_client column to tasks table

  1. Changes
    - Add `visible_to_client` column to `tasks` table
    - Set default value to FALSE
    - Column type: BOOLEAN

  2. Purpose
    - Controls whether tasks are visible to clients
    - Allows business users to hide internal tasks from client view
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'visible_to_client'
  ) THEN
    ALTER TABLE tasks ADD COLUMN visible_to_client boolean DEFAULT false;
  END IF;
END $$;