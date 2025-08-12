'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentManagerExample } from '@/components/storage/DocumentManager';

export default function StorageDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          📁 Storage System Demo
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Demonstration of the Supabase Storage configuration for document management 
          in the insurance CRM. This system provides secure, organized file storage 
          with proper access controls.
        </p>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ Storage Architecture</CardTitle>
          <CardDescription>
            Overview of the configured storage buckets and their purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <h3 className="font-semibold">Underwriting Documents</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Documents required for underwriting process
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">50MB limit</Badge>
                <Badge variant="outline" className="text-xs">Private</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📄</span>
                <h3 className="font-semibold">ACORD Forms</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Standard insurance industry forms
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">50MB limit</Badge>
                <Badge variant="outline" className="text-xs">Private</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👤</span>
                <h3 className="font-semibold">User Avatars</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                User profile pictures and avatars
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">5MB limit</Badge>
                <Badge variant="default" className="text-xs">Public</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-semibold">Quote Documents</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Insurance quotes and proposals
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">50MB limit</Badge>
                <Badge variant="outline" className="text-xs">Private</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="font-semibold">Policy Documents</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Active insurance policies and certificates
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">50MB limit</Badge>
                <Badge variant="outline" className="text-xs">Private</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📁</span>
                <h3 className="font-semibold">Other Documents</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Miscellaneous files and correspondence
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">50MB limit</Badge>
                <Badge variant="outline" className="text-xs">Private</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Security Features</CardTitle>
          <CardDescription>
            Built-in security and access control mechanisms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Row Level Security (RLS)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Users can only access their own files</li>
                <li>• Lead/client files accessible by authorized users</li>
                <li>• Admins and managers have full access</li>
                <li>• Separate policies for read/write operations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">File Validation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• File size limits enforced per bucket</li>
                <li>• MIME type validation for security</li>
                <li>• Automatic file path generation</li>
                <li>• Audit trail for all operations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Organization */}
      <Card>
        <CardHeader>
          <CardTitle>📂 File Organization</CardTitle>
          <CardDescription>
            How files are organized and structured in storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="space-y-1">
              <div>bucket/</div>
              <div className="ml-4">├── user_id/</div>
              <div className="ml-8">│   └── filename</div>
              <div className="ml-4">├── user_id/lead_id/</div>
              <div className="ml-8">│   └── filename</div>
              <div className="ml-4">└── user_id/client_id/</div>
              <div className="ml-8">    └── filename</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Files are automatically organized by user and entity (lead/client) for easy management and access control.
          </p>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 Interactive Demo</CardTitle>
          <CardDescription>
            Try out the document management interface below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <h4 className="font-semibold text-yellow-800">Demo Mode</h4>
            </div>
            <p className="text-sm text-yellow-700">
              This is a demonstration interface. To fully test file uploads, you'll need to:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Be authenticated with a valid user session</li>
              <li>• Have proper permissions for the selected entity</li>
              <li>• Ensure the storage migration has been applied</li>
            </ul>
          </div>

          <DocumentManagerExample />
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 API Usage</CardTitle>
          <CardDescription>
            How to integrate the storage system into your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Upload Files</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                POST /api/storage/upload
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Download Files</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                GET /api/storage/download?bucket=BUCKET&path=PATH
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">List Files</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                GET /api/storage/upload?bucket=BUCKET&entityType=TYPE
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Delete Files</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                DELETE /api/storage/delete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Next Steps</CardTitle>
          <CardDescription>
            How to implement this storage system in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Apply the Migration</h4>
                <p className="text-sm text-muted-foreground">
                  Run the storage migration in your Supabase project to create buckets and policies.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Import Components</h4>
                <p className="text-sm text-muted-foreground">
                  Use the FileUpload, FileManager, or DocumentManager components in your pages.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Test the System</h4>
                <p className="text-sm text-muted-foreground">
                  Run the storage test script to verify everything is working correctly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
