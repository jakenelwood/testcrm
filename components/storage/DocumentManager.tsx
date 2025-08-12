'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from './FileUpload';
import { FileManager } from './FileManager';
import { StorageBucket } from '@/utils/supabase/storage';

interface DocumentManagerProps {
  entityType: 'lead' | 'client' | 'user';
  entityId?: string;
  entityName?: string;
  className?: string;
}

interface BucketConfig {
  id: StorageBucket;
  name: string;
  description: string;
  icon: string;
  accept: string;
  maxFiles: number;
  examples: string[];
}

const bucketConfigs: BucketConfig[] = [
  {
    id: 'underwriting-documents',
    name: 'Underwriting Documents',
    description: 'Documents required for underwriting process',
    icon: '📋',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff',
    maxFiles: 20,
    examples: ['Application forms', 'Financial statements', 'Property inspections', 'Medical records']
  },
  {
    id: 'acord-forms',
    name: 'ACORD Forms',
    description: 'Standard insurance industry forms',
    icon: '📄',
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
    maxFiles: 15,
    examples: ['ACORD 25', 'ACORD 27', 'ACORD 28', 'Certificate requests']
  },
  {
    id: 'quote-documents',
    name: 'Quote Documents',
    description: 'Insurance quotes and proposals',
    icon: '💰',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
    maxFiles: 10,
    examples: ['Insurance quotes', 'Proposals', 'Rate comparisons', 'Coverage summaries']
  },
  {
    id: 'policy-documents',
    name: 'Policy Documents',
    description: 'Active insurance policies and related documents',
    icon: '🛡️',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff',
    maxFiles: 25,
    examples: ['Policy declarations', 'Endorsements', 'Certificates', 'Renewal documents']
  },
  {
    id: 'other-documents',
    name: 'Other Documents',
    description: 'Miscellaneous documents and files',
    icon: '📁',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.tiff,.gif,.webp',
    maxFiles: 30,
    examples: ['Correspondence', 'Notes', 'Photos', 'Miscellaneous files']
  }
];

export function DocumentManager({
  entityType,
  entityId,
  entityName,
  className
}: DocumentManagerProps) {
  const [activeTab, setActiveTab] = useState<StorageBucket>('underwriting-documents');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = (files: any[]) => {
    console.log('Files uploaded:', files);
    // Refresh the file manager
    setRefreshKey(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // You could show a toast notification here
  };

  const handleFileDelete = (file: any) => {
    console.log('File deleted:', file);
    // Refresh the file manager
    setRefreshKey(prev => prev + 1);
  };

  // Filter buckets based on entity type
  const availableBuckets = entityType === 'user' 
    ? bucketConfigs.filter(b => b.id === 'other-documents')
    : bucketConfigs;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📁 Document Manager
            {entityName && (
              <Badge variant="secondary" className="ml-2">
                {entityName}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload and manage documents for this {entityType}. 
            Files are organized by category and secured with proper access controls.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StorageBucket)}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
              {availableBuckets.map((bucket) => (
                <TabsTrigger 
                  key={bucket.id} 
                  value={bucket.id}
                  className="text-xs lg:text-sm"
                >
                  <span className="mr-1">{bucket.icon}</span>
                  <span className="hidden sm:inline">{bucket.name}</span>
                  <span className="sm:hidden">{bucket.name.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {availableBuckets.map((bucket) => (
              <TabsContent key={bucket.id} value={bucket.id} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {bucket.icon} Upload {bucket.name}
                      </CardTitle>
                      <CardDescription>
                        {bucket.description}
                      </CardDescription>
                      
                      {/* Examples */}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
                        <div className="flex flex-wrap gap-1">
                          {bucket.examples.map((example, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <FileUpload
                        bucket={bucket.id}
                        entityType={entityType}
                        entityId={entityId}
                        multiple={true}
                        accept={bucket.accept}
                        maxFiles={bucket.maxFiles}
                        onUploadComplete={handleUploadComplete}
                        onUploadError={handleUploadError}
                      />
                    </CardContent>
                  </Card>

                  {/* File Manager Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Existing Files</CardTitle>
                      <CardDescription>
                        View and manage uploaded {bucket.name.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <FileManager
                        key={`${bucket.id}-${refreshKey}`}
                        bucket={bucket.id}
                        path={entityType === 'user' ? undefined : `${entityId}`}
                        onFileDelete={handleFileDelete}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* File Type Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">File Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Accepted Formats</h4>
                        <p className="text-sm text-gray-600">
                          {bucket.accept.split(',').join(', ')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Maximum File Size</h4>
                        <p className="text-sm text-gray-600">
                          {bucket.id === 'user-avatars' ? '5 MB' : '50 MB'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Maximum Files</h4>
                        <p className="text-sm text-gray-600">
                          {bucket.maxFiles} files per upload
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Example usage component for testing
export function DocumentManagerExample() {
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'lead' | 'client' | 'user';
    id?: string;
    name?: string;
  }>({
    type: 'user'
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Manager Demo</CardTitle>
          <CardDescription>
            Test the document management system with different entity types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedEntity({ type: 'user' })}
              className={`px-3 py-2 rounded text-sm ${
                selectedEntity.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              User Documents
            </button>
            <button
              onClick={() => setSelectedEntity({ 
                type: 'lead', 
                id: 'demo-lead-id', 
                name: 'Demo Lead' 
              })}
              className={`px-3 py-2 rounded text-sm ${
                selectedEntity.type === 'lead' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Lead Documents
            </button>
            <button
              onClick={() => setSelectedEntity({ 
                type: 'client', 
                id: 'demo-client-id', 
                name: 'Demo Client' 
              })}
              className={`px-3 py-2 rounded text-sm ${
                selectedEntity.type === 'client' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Client Documents
            </button>
          </div>
        </CardContent>
      </Card>

      <DocumentManager
        entityType={selectedEntity.type}
        entityId={selectedEntity.id}
        entityName={selectedEntity.name}
      />
    </div>
  );
}
