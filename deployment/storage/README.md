# Storage Directory

This directory is used by Supabase Storage API for file storage.

## Purpose
- Mounted as `/var/lib/storage` inside the `supabase-storage` container
- Stores uploaded files, images, and other assets
- Provides persistent storage for the CRM application

## Structure
When the application is running, this directory will contain:
- Uploaded files organized by buckets
- Temporary files during upload processing
- Storage metadata

## Important Notes
- This directory should be included in backups
- Files in this directory are persistent across container restarts
- The directory is created automatically when the storage service starts
- Permissions are managed by the Docker container

## Configuration
The storage service is configured in `docker-compose.yml`:
- Backend: File system storage
- Path: `/var/lib/storage` (mapped to this directory)
- Size limit: 50MB per file
