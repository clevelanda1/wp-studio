/*
  # Create project_files storage bucket

  1. Storage Setup
    - Create `project_files` bucket for storing project files
    - Set bucket as public for easy access to files
    
  2. Security Policies
    - Allow authenticated users to upload files (INSERT)
    - Allow authenticated users to view files (SELECT) 
    - Allow authenticated users to delete files (DELETE)
    - Restrict access to authenticated users only
    
  3. Notes
    - Bucket is set to public for easier file access
    - RLS policies ensure only authenticated users can manage files
    - File paths will be organized by project ID
*/

-- Create the project_files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project_files',
  'project_files', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project_files');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project_files');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project_files');