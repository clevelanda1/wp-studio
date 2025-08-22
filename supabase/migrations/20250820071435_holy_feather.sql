/*
  # Add items column to returns table

  1. Changes
    - Add `items` column to `returns` table as JSONB array
    - Update existing records to have empty items array
    - Add check constraint to ensure items is an array

  2. Security
    - No changes to RLS policies needed
*/

-- Add the items column as JSONB to store array of return items
ALTER TABLE returns ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Update any existing records to have empty items array if null
UPDATE returns SET items = '[]'::jsonb WHERE items IS NULL;

-- Add a check constraint to ensure items is always an array
ALTER TABLE returns ADD CONSTRAINT returns_items_is_array 
  CHECK (jsonb_typeof(items) = 'array');

-- Add comment for documentation
COMMENT ON COLUMN returns.items IS 'Array of return items with name, quantity, and optional unit price';