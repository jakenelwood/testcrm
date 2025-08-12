'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  Eye, 
  File, 
  FileText, 
  Image, 
  FileSpreadsheet,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { storageManager, StorageBucket } from '@/utils/supabase/storage';

interface FileManagerProps {
  bucket: StorageBucket;
  path?: string;
  onFileSelect?: (file: StorageFile) => void;
  onFileDelete?: (file: StorageFile) => void;
  className?: string;
}

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    [key: string]: any;
  };
}

export function FileManager({
  bucket,
  path = '',
  onFileSelect,
  onFileDelete,
  className
}: FileManagerProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteFile, setDeleteFile] = useState<StorageFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: listError } = await storageManager.listFiles(bucket, path);
      
      if (listError) {
        throw listError;
      }

      setFiles(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [bucket, path]);

  const handleDownload = async (file: StorageFile) => {
    try {
      const filePath = path ? `${path}/${file.name}` : file.name;
      
      if (bucket === 'user-avatars') {
        // Public bucket - use public URL
        const { data } = storageManager.getPublicUrl(bucket, filePath);
        window.open(data.publicUrl, '_blank');
      } else {
        // Private bucket - get signed URL
        const { data, error } = await storageManager.getSignedUrl(bucket, filePath, 300); // 5 minutes
        
        if (error) {
          throw error;
        }

        if (data?.signedUrl) {
          // Create a temporary link to download the file
          const link = document.createElement('a');
          link.href = data.signedUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
    }
  };

  const handleView = async (file: StorageFile) => {
    try {
      const filePath = path ? `${path}/${file.name}` : file.name;
      
      if (bucket === 'user-avatars') {
        // Public bucket - use public URL
        const { data } = storageManager.getPublicUrl(bucket, filePath);
        window.open(data.publicUrl, '_blank');
      } else {
        // Private bucket - get signed URL
        const { data, error } = await storageManager.getSignedUrl(bucket, filePath, 300); // 5 minutes
        
        if (error) {
          throw error;
        }

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to view file';
      setError(errorMessage);
    }
  };

  const confirmDelete = async () => {
    if (!deleteFile) return;

    setDeletingFile(deleteFile.id);
    
    try {
      const filePath = path ? `${path}/${deleteFile.name}` : deleteFile.name;
      const { error } = await storageManager.deleteFile(bucket, filePath);
      
      if (error) {
        throw error;
      }

      // Remove file from list
      setFiles(prev => prev.filter(f => f.id !== deleteFile.id));
      onFileDelete?.(deleteFile);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
    } finally {
      setDeletingFile(null);
      setDeleteFile(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBucketDisplayName = (bucket: StorageBucket): string => {
    const names = {
      'underwriting-documents': 'Underwriting Documents',
      'acord-forms': 'ACORD Forms',
      'user-avatars': 'User Avatars',
      'quote-documents': 'Quote Documents',
      'policy-documents': 'Policy Documents',
      'other-documents': 'Other Documents'
    };
    return names[bucket];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading files...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            {getBucketDisplayName(bucket)}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No files found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {getFileIcon(file.metadata.mimetype)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.metadata.size)}</span>
                      <span>{formatDate(file.created_at)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.metadata.mimetype.split('/')[1].toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(file)}
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteFile(file)}
                      disabled={deletingFile === file.id}
                      title="Delete file"
                    >
                      {deletingFile === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
