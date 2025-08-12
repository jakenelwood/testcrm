# Supabase Storage Configuration for Insurance CRM

This document describes the complete storage configuration for document management in the insurance CRM system.

## Overview

The storage system is designed to handle various types of insurance-related documents with proper security, access controls, and organization. It uses Supabase Storage with Row Level Security (RLS) policies to ensure data protection.

## Storage Buckets

### 1. Underwriting Documents (`underwriting-documents`)
- **Purpose**: Documents required for the underwriting process
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, Word, Excel, Images (JPEG, PNG, TIFF)
- **Examples**: Application forms, financial statements, property inspections, medical records

### 2. ACORD Forms (`acord-forms`)
- **Purpose**: Standard insurance industry forms
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, Word, Images (JPEG, PNG)
- **Examples**: ACORD 25, ACORD 27, ACORD 28, Certificate requests

### 3. User Avatars (`user-avatars`)
- **Purpose**: User profile pictures
- **Access**: Public (readable by anyone)
- **File Size Limit**: 5MB
- **Allowed Types**: Images (JPEG, PNG, WebP, GIF)
- **Examples**: Profile photos, user avatars

### 4. Quote Documents (`quote-documents`)
- **Purpose**: Insurance quotes and proposals
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, Word, Excel, Images (JPEG, PNG)
- **Examples**: Insurance quotes, proposals, rate comparisons, coverage summaries

### 5. Policy Documents (`policy-documents`)
- **Purpose**: Active insurance policies and related documents
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, Word, Excel, Images (JPEG, PNG, TIFF)
- **Examples**: Policy declarations, endorsements, certificates, renewal documents

### 6. Other Documents (`other-documents`)
- **Purpose**: Miscellaneous documents and files
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, Word, Excel, PowerPoint, Text, CSV, Images
- **Examples**: Correspondence, notes, photos, miscellaneous files

## File Organization Structure

Files are organized using a hierarchical folder structure:

```
bucket/
├── user_id/                    # User's own files
│   └── filename
├── user_id/lead_id/           # Files associated with a lead
│   └── filename
└── user_id/client_id/         # Files associated with a client
    └── filename
```

## Security and Access Control

### Row Level Security (RLS) Policies

All storage buckets have comprehensive RLS policies that ensure:

1. **User Ownership**: Users can access files they uploaded
2. **Entity Access**: Users can access files for leads/clients they have permission to view
3. **Role-Based Access**: Admins and managers can access all files
4. **Operation-Specific**: Separate policies for SELECT, INSERT, UPDATE, DELETE operations

### Access Patterns

- **Lead Files**: Accessible by lead creator, assigned user, admins, and managers
- **Client Files**: Accessible by client creator, users with lead access to that client, admins, and managers
- **User Files**: Accessible only by the user who uploaded them (and admins/managers)

## API Endpoints

### Upload Files
```
POST /api/storage/upload
```
**Body (FormData):**
- `file`: File to upload
- `bucket`: Target bucket name
- `entityType`: 'user', 'lead', or 'client'
- `entityId`: ID of the entity (required for lead/client)

### Download Files
```
GET /api/storage/download?bucket=BUCKET&path=PATH&download=true
```

### List Files
```
GET /api/storage/upload?bucket=BUCKET&entityType=TYPE&entityId=ID
```

### Delete Files
```
DELETE /api/storage/delete
```
**Body:**
- `bucket`: Bucket name
- `filePath`: Path to file to delete

## Components

### FileUpload Component
```tsx
import { FileUpload } from '@/components/storage/FileUpload';

<FileUpload
  bucket="underwriting-documents"
  entityType="lead"
  entityId="lead-uuid"
  multiple={true}
  maxFiles={10}
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  onUploadError={(error) => console.error('Error:', error)}
/>
```

### FileManager Component
```tsx
import { FileManager } from '@/components/storage/FileManager';

<FileManager
  bucket="quote-documents"
  path="user-id/lead-id"
  onFileSelect={(file) => console.log('Selected:', file)}
  onFileDelete={(file) => console.log('Deleted:', file)}
/>
```

### DocumentManager Component
```tsx
import { DocumentManager } from '@/components/storage/DocumentManager';

<DocumentManager
  entityType="lead"
  entityId="lead-uuid"
  entityName="John Doe Lead"
/>
```

## Database Tables

### file_uploads
Tracks all file uploads for audit and management purposes.

```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
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
```

### file_deletions
Tracks file deletions for audit purposes.

```sql
CREATE TABLE file_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
```

## Helper Functions

### get_storage_path()
Generates appropriate storage paths based on entity type and user permissions.

### validate_file_upload()
Validates file uploads against bucket constraints and user permissions.

## Usage Examples

### Upload a Document for a Lead
```typescript
import { storageManager } from '@/utils/supabase/storage';

const { data, error } = await storageManager.uploadFile({
  bucket: 'underwriting-documents',
  entityType: 'lead',
  entityId: 'lead-uuid',
  file: selectedFile
});
```

### Get a Signed URL for Download
```typescript
const { data, error } = await storageManager.getSignedUrl(
  'policy-documents',
  'user-id/client-id/policy.pdf',
  3600 // 1 hour expiry
);
```

### List Files for a Client
```typescript
const { data, error } = await storageManager.listFiles(
  'quote-documents',
  'user-id/client-id'
);
```

## Testing

Run the storage configuration test script:

```bash
npm run test:storage
```

This will verify:
- All buckets are created correctly
- Policies are working as expected
- Database tables are accessible
- Helper functions are working

## Migration

The storage configuration is applied via migration:
```
supabase/migrations/20250112000018_configure_storage_buckets.sql
```

To apply the migration:
```bash
supabase db push
```

## Security Considerations

1. **File Size Limits**: Enforced at bucket level to prevent abuse
2. **MIME Type Validation**: Only allowed file types can be uploaded
3. **Access Control**: RLS policies ensure users can only access authorized files
4. **Audit Trail**: All uploads and deletions are logged
5. **Signed URLs**: Private files use time-limited signed URLs for access
6. **Path Validation**: File paths are validated to prevent directory traversal

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size and MIME type restrictions
2. **Access Denied**: Verify user has permission to the lead/client
3. **File Not Found**: Ensure correct bucket and path
4. **Policy Errors**: Check RLS policies are properly configured

### Debug Steps

1. Check browser console for errors
2. Verify user authentication status
3. Test with storage test script
4. Check Supabase dashboard for policy violations
5. Review server logs for API errors
