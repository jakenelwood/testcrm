-- =============================================================================
-- SUPABASE STORAGE CONFIGURATION FOR INSURANCE CRM
-- =============================================================================
-- This migration sets up storage buckets and policies for document management
-- in the insurance CRM with proper security and access controls.

-- =============================================================================
-- STORAGE BUCKETS CREATION
-- =============================================================================

-- Create storage buckets for different document types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Underwriting documents (private, large files allowed)
  ('underwriting-documents', 'underwriting-documents', false, 52428800, ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
  
  -- ACORD forms (private, PDF focused)
  ('acord-forms', 'acord-forms', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]),
  
  -- User avatars (public, small images only)
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]),
  
  -- Quote documents (private, various formats)
  ('quote-documents', 'quote-documents', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]),
  
  -- Policy documents (private, various formats)
  ('policy-documents', 'policy-documents', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ]),
  
  -- Other documents (private, most formats allowed)
  ('other-documents', 'other-documents', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/gif',
    'image/webp'
  ])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES - USER AVATARS (PUBLIC BUCKET)
-- =============================================================================

-- User avatars - users can upload their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- User avatars - users can update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    auth.role() = 'authenticated'
  );

-- User avatars - users can delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    auth.role() = 'authenticated'
  );

-- User avatars - public read access (since bucket is public)
CREATE POLICY "Anyone can view user avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

-- =============================================================================
-- STORAGE POLICIES - UNDERWRITING DOCUMENTS (PRIVATE BUCKET)
-- =============================================================================

-- Underwriting documents - users can upload documents for their leads/clients
CREATE POLICY "Users can upload underwriting documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'underwriting-documents' AND
    auth.role() = 'authenticated' AND
    (
      -- User is uploading to their own folder
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- User has access to the lead/client (folder structure: user_id/lead_id/ or user_id/client_id/)
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      -- Admin/Manager can upload anywhere
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- Underwriting documents - users can view documents they have access to
CREATE POLICY "Users can view underwriting documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'underwriting-documents' AND
    auth.role() = 'authenticated' AND
    (
      -- User owns the folder
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- User has access to the lead/client
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        (c.created_by = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.leads l2
           WHERE l2.client_id = c.id AND (l2.created_by = auth.uid() OR l2.assigned_to = auth.uid())
         ))
      ) OR
      -- Admin/Manager can view all
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- Underwriting documents - users can update documents they have access to
CREATE POLICY "Users can update underwriting documents they have access to" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'underwriting-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- Underwriting documents - users can delete documents they have access to
CREATE POLICY "Users can delete underwriting documents they have access to" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'underwriting-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- =============================================================================
-- STORAGE POLICIES - ACORD FORMS (PRIVATE BUCKET)
-- =============================================================================

-- ACORD forms - similar policies to underwriting documents
CREATE POLICY "Users can upload ACORD forms" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'acord-forms' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can view ACORD forms they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'acord-forms' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        (c.created_by = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.leads l2
           WHERE l2.client_id = c.id AND (l2.created_by = auth.uid() OR l2.assigned_to = auth.uid())
         ))
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can update ACORD forms they have access to" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'acord-forms' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can delete ACORD forms they have access to" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'acord-forms' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- =============================================================================
-- STORAGE POLICIES - QUOTE DOCUMENTS (PRIVATE BUCKET)
-- =============================================================================

-- Quote documents - users can upload quote documents for their leads/clients
CREATE POLICY "Users can upload quote documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'quote-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can view quote documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'quote-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        (c.created_by = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.leads l2
           WHERE l2.client_id = c.id AND (l2.created_by = auth.uid() OR l2.assigned_to = auth.uid())
         ))
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can update quote documents they have access to" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'quote-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can delete quote documents they have access to" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'quote-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- =============================================================================
-- STORAGE POLICIES - POLICY DOCUMENTS (PRIVATE BUCKET)
-- =============================================================================

-- Policy documents - users can upload policy documents for their clients
CREATE POLICY "Users can upload policy documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can view policy documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        (c.created_by = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.leads l2
           WHERE l2.client_id = c.id AND (l2.created_by = auth.uid() OR l2.assigned_to = auth.uid())
         ))
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can update policy documents they have access to" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can delete policy documents they have access to" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- =============================================================================
-- STORAGE POLICIES - OTHER DOCUMENTS (PRIVATE BUCKET)
-- =============================================================================

-- Other documents - users can upload miscellaneous documents for their leads/clients
CREATE POLICY "Users can upload other documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'other-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can view other documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'other-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        (c.created_by = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.leads l2
           WHERE l2.client_id = c.id AND (l2.created_by = auth.uid() OR l2.assigned_to = auth.uid())
         ))
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can update other documents they have access to" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'other-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can delete other documents they have access to" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'other-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id::text = (storage.foldername(name))[2] AND
        (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id::text = (storage.foldername(name))[2] AND
        c.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
      )
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS FOR STORAGE OPERATIONS
-- =============================================================================

-- Function to get the appropriate storage path for a document
CREATE OR REPLACE FUNCTION public.get_storage_path(
  bucket_name TEXT,
  entity_type TEXT, -- 'lead', 'client', 'user'
  entity_id UUID,
  filename TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  path TEXT;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Construct the path based on entity type
  CASE entity_type
    WHEN 'user' THEN
      path := user_id::text || '/' || filename;
    WHEN 'lead' THEN
      -- Verify user has access to the lead
      IF NOT EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = entity_id AND (l.created_by = user_id OR l.assigned_to = user_id)
      ) AND NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_id AND u.role IN ('admin', 'manager')
      ) THEN
        RAISE EXCEPTION 'Access denied to lead %', entity_id;
      END IF;
      path := user_id::text || '/' || entity_id::text || '/' || filename;
    WHEN 'client' THEN
      -- Verify user has access to the client
      IF NOT EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = entity_id AND c.created_by = user_id
      ) AND NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_id AND u.role IN ('admin', 'manager')
      ) THEN
        RAISE EXCEPTION 'Access denied to client %', entity_id;
      END IF;
      path := user_id::text || '/' || entity_id::text || '/' || filename;
    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', entity_type;
  END CASE;

  RETURN path;
END;
$$;

-- Function to validate file upload permissions
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  bucket_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_config RECORD;
  user_id UUID;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get bucket configuration
  SELECT file_size_limit, allowed_mime_types
  INTO bucket_config
  FROM storage.buckets
  WHERE id = bucket_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket % not found', bucket_name;
  END IF;

  -- Check file size limit
  IF file_size > bucket_config.file_size_limit THEN
    RAISE EXCEPTION 'File size % exceeds limit of %', file_size, bucket_config.file_size_limit;
  END IF;

  -- Check MIME type
  IF bucket_config.allowed_mime_types IS NOT NULL AND
     NOT (mime_type = ANY(bucket_config.allowed_mime_types)) THEN
    RAISE EXCEPTION 'MIME type % not allowed for bucket %', mime_type, bucket_name;
  END IF;

  RETURN TRUE;
END;
$$;

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant usage on storage schema to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Grant access to storage.objects for authenticated users
GRANT ALL ON storage.objects TO authenticated;

-- Grant access to storage.buckets for authenticated users (read-only)
GRANT SELECT ON storage.buckets TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_storage_path(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_file_upload(TEXT, TEXT, BIGINT, TEXT) TO authenticated;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.get_storage_path IS 'Generates appropriate storage paths for documents based on entity type and user permissions';
COMMENT ON FUNCTION public.validate_file_upload IS 'Validates file uploads against bucket constraints and user permissions';

-- Bucket documentation
UPDATE storage.buckets SET
  public = false,
  avif_autodetection = false,
  file_size_limit = 52428800
WHERE id IN ('underwriting-documents', 'acord-forms', 'quote-documents', 'policy-documents', 'other-documents');

UPDATE storage.buckets SET
  public = true,
  avif_autodetection = true,
  file_size_limit = 5242880
WHERE id = 'user-avatars';

-- =============================================================================
-- FILE TRACKING TABLES
-- =============================================================================

-- Table to track file uploads for audit and management
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('user', 'lead', 'client')),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to track file deletions for audit purposes
CREATE TABLE IF NOT EXISTS public.file_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_bucket_name ON public.file_uploads(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON public.file_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON public.file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_file_deletions_user_id ON public.file_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_deletions_bucket_name ON public.file_deletions(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_deletions_deleted_at ON public.file_deletions(deleted_at);

-- Enable RLS on file tracking tables
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_deletions ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_uploads
CREATE POLICY "Users can view their own file uploads" ON public.file_uploads
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own file uploads" ON public.file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own file uploads" ON public.file_uploads
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can delete their own file uploads" ON public.file_uploads
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

-- RLS policies for file_deletions
CREATE POLICY "Users can view their own file deletions" ON public.file_deletions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert file deletions" ON public.file_deletions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.file_uploads TO authenticated;
GRANT ALL ON public.file_deletions TO authenticated;
