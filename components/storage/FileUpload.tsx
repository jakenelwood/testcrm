'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { storageManager, StorageBucket, EntityType } from '@/utils/supabase/storage';

interface FileUploadProps {
  bucket: StorageBucket;
  entityType: EntityType;
  entityId?: string;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  url?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

export function FileUpload({
  bucket,
  entityType,
  entityId,
  multiple = false,
  accept,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [disabled]);

  const handleFiles = useCallback((newFiles: File[]) => {
    // Check file limits
    const currentFileCount = files.length;
    const availableSlots = maxFiles - currentFileCount;
    const filesToAdd = newFiles.slice(0, availableSlots);

    if (newFiles.length > availableSlots) {
      onUploadError?.(`Maximum ${maxFiles} files allowed. Only first ${availableSlots} files will be added.`);
    }

    // Add files to state
    const filesWithProgress: FileWithProgress[] = filesToAdd.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...filesWithProgress]);
  }, [files.length, maxFiles, onUploadError]);

  const uploadFiles = useCallback(async () => {
    if (isUploading || disabled) return;

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileWithProgress = files[i];
        
        if (fileWithProgress.status !== 'pending') continue;

        // Update status to uploading
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, status: 'uploading' as const } : f
        ));

        try {
          const { data, error } = await storageManager.uploadFile({
            bucket,
            entityType,
            entityId,
            file: fileWithProgress.file,
            onProgress: (progress) => {
              setFiles(prev => prev.map((f, index) => 
                index === i ? { ...f, progress } : f
              ));
            }
          });

          if (error) {
            throw error;
          }

          // Get file URL
          let url: string | undefined;
          if (bucket === 'user-avatars') {
            // Public bucket
            const { data: urlData } = storageManager.getPublicUrl(bucket, data.path);
            url = urlData.publicUrl;
          } else {
            // Private bucket - get signed URL
            const { data: urlData } = await storageManager.getSignedUrl(bucket, data.path, 3600);
            url = urlData?.signedUrl;
          }

          const uploadedFile: UploadedFile = {
            name: fileWithProgress.file.name,
            path: data.path,
            size: fileWithProgress.file.size,
            type: fileWithProgress.file.type,
            url
          };

          uploadedFiles.push(uploadedFile);

          // Update status to completed
          setFiles(prev => prev.map((f, index) => 
            index === i ? { 
              ...f, 
              status: 'completed' as const, 
              progress: 100,
              uploadedFile 
            } : f
          ));

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          
          // Update status to error
          setFiles(prev => prev.map((f, index) => 
            index === i ? { 
              ...f, 
              status: 'error' as const, 
              error: errorMessage 
            } : f
          ));

          onUploadError?.(errorMessage);
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete?.(uploadedFiles);
      }

    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, disabled, bucket, entityType, entityId, onUploadComplete, onUploadError]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const hasFiles = files.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver && !disabled ? "border-blue-500 bg-blue-50" : "border-gray-300",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop files here' : 'Upload files'}
        </p>
        <p className="text-sm text-gray-500">
          Drag and drop files here, or click to select files
        </p>
        {accept && (
          <p className="text-xs text-gray-400 mt-2">
            Accepted formats: {accept}
          </p>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Files ({files.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(fileWithProgress.status)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileWithProgress.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileWithProgress.file.size)}
                  </p>
                  
                  {fileWithProgress.status === 'uploading' && (
                    <Progress value={fileWithProgress.progress} className="mt-1" />
                  )}
                  
                  {fileWithProgress.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {fileWithProgress.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading && fileWithProgress.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {pendingFiles.length > 0 && (
        <Button
          onClick={uploadFiles}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}`}
        </Button>
      )}
    </div>
  );
}
