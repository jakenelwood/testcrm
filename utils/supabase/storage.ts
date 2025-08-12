import { createClient } from './client';
import { Database } from '@/types/database.types';

export type StorageBucket = 
  | 'underwriting-documents'
  | 'acord-forms'
  | 'user-avatars'
  | 'quote-documents'
  | 'policy-documents'
  | 'other-documents';

export type EntityType = 'user' | 'lead' | 'client';

export interface FileUploadOptions {
  bucket: StorageBucket;
  entityType: EntityType;
  entityId?: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface FileMetadata {
  id: string;
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

/**
 * Storage utility class for handling file operations with Supabase Storage
 */
export class StorageManager {
  private supabase = createClient();

  /**
   * Upload a file to the specified bucket
   */
  async uploadFile(options: FileUploadOptions): Promise<{ data: any; error: any }> {
    const { bucket, entityType, entityId, file, onProgress } = options;

    try {
      // Validate file
      const validation = await this.validateFile(bucket, file);
      if (!validation.valid) {
        return { data: null, error: new Error(validation.error) };
      }

      // Generate file path
      const filePath = await this.generateFilePath(bucket, entityType, entityId, file.name);

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(bucket: StorageBucket, filePath: string): Promise<{ data: Blob | null; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(filePath);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get a signed URL for a file
   */
  async getSignedUrl(
    bucket: StorageBucket, 
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{ data: { signedUrl: string } | null; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get public URL for a file (only works for public buckets like user-avatars)
   */
  getPublicUrl(bucket: StorageBucket, filePath: string): { data: { publicUrl: string } } {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { data };
  }

  /**
   * List files in a bucket with optional path prefix
   */
  async listFiles(
    bucket: StorageBucket, 
    path?: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path, {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: StorageBucket, filePath: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Move a file within storage
   */
  async moveFile(
    bucket: StorageBucket, 
    fromPath: string, 
    toPath: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Copy a file within storage
   */
  async copyFile(
    bucket: StorageBucket, 
    fromPath: string, 
    toPath: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Generate appropriate file path based on entity type and user permissions
   */
  private async generateFilePath(
    bucket: StorageBucket,
    entityType: EntityType,
    entityId: string | undefined,
    filename: string
  ): Promise<string> {
    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Clean filename
    const cleanFilename = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${cleanFilename}`;

    switch (entityType) {
      case 'user':
        return `${user.id}/${uniqueFilename}`;
      case 'lead':
      case 'client':
        if (!entityId) {
          throw new Error(`Entity ID is required for ${entityType} uploads`);
        }
        return `${user.id}/${entityId}/${uniqueFilename}`;
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  }

  /**
   * Validate file against bucket constraints
   */
  private async validateFile(bucket: StorageBucket, file: File): Promise<{ valid: boolean; error?: string }> {
    // Get bucket configuration
    const bucketConfig = this.getBucketConfig(bucket);

    // Check file size
    if (file.size > bucketConfig.maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(bucketConfig.maxSize)})`
      };
    }

    // Check MIME type
    if (!bucketConfig.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed for ${bucket} bucket`
      };
    }

    return { valid: true };
  }

  /**
   * Get bucket configuration
   */
  private getBucketConfig(bucket: StorageBucket) {
    const configs = {
      'underwriting-documents': {
        maxSize: 52428800, // 50MB
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/tiff',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      },
      'acord-forms': {
        maxSize: 52428800, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png'
        ]
      },
      'user-avatars': {
        maxSize: 5242880, // 5MB
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ]
      },
      'quote-documents': {
        maxSize: 52428800, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png'
        ]
      },
      'policy-documents': {
        maxSize: 52428800, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/tiff'
        ]
      },
      'other-documents': {
        maxSize: 52428800, // 50MB
        allowedTypes: [
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
        ]
      }
    };

    return configs[bucket];
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
