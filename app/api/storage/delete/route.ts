import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storageManager, StorageBucket } from '@/utils/supabase/storage';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bucket, filePath } = body;

    if (!bucket || !filePath) {
      return NextResponse.json(
        { error: 'Bucket and file path are required' },
        { status: 400 }
      );
    }

    // Validate bucket
    const validBuckets: StorageBucket[] = [
      'underwriting-documents',
      'acord-forms',
      'user-avatars',
      'quote-documents',
      'policy-documents',
      'other-documents'
    ];

    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket' },
        { status: 400 }
      );
    }

    // Check if user has access to delete this file
    const pathParts = filePath.split('/');
    const fileOwnerId = pathParts[0];
    
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check access permissions
    let hasAccess = false;

    if (fileOwnerId === user.id) {
      // User owns the file
      hasAccess = true;
    } else if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      // Admin/Manager can delete all files
      hasAccess = true;
    } else if (pathParts.length >= 2) {
      // Check if user has access to the entity (lead/client)
      const entityId = pathParts[1];
      
      // Check lead access
      const { data: lead } = await supabase
        .from('leads')
        .select('id, created_by, assigned_to')
        .eq('id', entityId)
        .single();

      if (lead && (lead.created_by === user.id || lead.assigned_to === user.id)) {
        hasAccess = true;
      }

      // Check client access
      if (!hasAccess) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, created_by')
          .eq('id', entityId)
          .single();

        if (client && client.created_by === user.id) {
          hasAccess = true;
        }

        // Also check if user has access through leads
        if (!hasAccess) {
          const { data: clientLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('client_id', entityId)
            .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);

          if (clientLeads && clientLeads.length > 0) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists in our database
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('bucket_name', bucket)
      .eq('file_path', filePath)
      .single();

    if (fileError && fileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', fileError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Delete file from storage
    const { error: deleteError } = await storageManager.deleteFile(bucket, filePath);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      );
    }

    // Delete file record from database if it exists
    if (fileRecord) {
      const { error: dbDeleteError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileRecord.id);

      if (dbDeleteError) {
        console.error('Database delete error:', dbDeleteError);
        // File was deleted from storage but not from database
        // This is not critical, but we should log it
      }
    }

    // Log the deletion for audit purposes
    await supabase
      .from('file_deletions')
      .insert({
        user_id: user.id,
        bucket_name: bucket,
        file_path: filePath,
        file_name: filePath.split('/').pop(),
        deleted_at: new Date().toISOString(),
        metadata: {
          original_file_record: fileRecord,
          deletion_reason: 'user_request'
        }
      });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bucket, filePaths } = body;

    if (!bucket || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json(
        { error: 'Bucket and file paths array are required' },
        { status: 400 }
      );
    }

    // Validate bucket
    const validBuckets: StorageBucket[] = [
      'underwriting-documents',
      'acord-forms',
      'user-avatars',
      'quote-documents',
      'policy-documents',
      'other-documents'
    ];

    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket' },
        { status: 400 }
      );
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const results = [];

    // Process each file deletion
    for (const filePath of filePaths) {
      try {
        // Check access permissions for each file
        const pathParts = filePath.split('/');
        const fileOwnerId = pathParts[0];
        
        let hasAccess = false;

        if (fileOwnerId === user.id) {
          hasAccess = true;
        } else if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
          hasAccess = true;
        } else if (pathParts.length >= 2) {
          const entityId = pathParts[1];
          
          const { data: lead } = await supabase
            .from('leads')
            .select('id, created_by, assigned_to')
            .eq('id', entityId)
            .single();

          if (lead && (lead.created_by === user.id || lead.assigned_to === user.id)) {
            hasAccess = true;
          }

          if (!hasAccess) {
            const { data: client } = await supabase
              .from('clients')
              .select('id, created_by')
              .eq('id', entityId)
              .single();

            if (client && client.created_by === user.id) {
              hasAccess = true;
            }

            if (!hasAccess) {
              const { data: clientLeads } = await supabase
                .from('leads')
                .select('id')
                .eq('client_id', entityId)
                .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);

              if (clientLeads && clientLeads.length > 0) {
                hasAccess = true;
              }
            }
          }
        }

        if (!hasAccess) {
          results.push({
            filePath,
            success: false,
            error: 'Access denied'
          });
          continue;
        }

        // Get file record
        const { data: fileRecord } = await supabase
          .from('file_uploads')
          .select('*')
          .eq('bucket_name', bucket)
          .eq('file_path', filePath)
          .single();

        // Delete file from storage
        const { error: deleteError } = await storageManager.deleteFile(bucket, filePath);

        if (deleteError) {
          results.push({
            filePath,
            success: false,
            error: 'Failed to delete from storage'
          });
          continue;
        }

        // Delete file record from database if it exists
        if (fileRecord) {
          await supabase
            .from('file_uploads')
            .delete()
            .eq('id', fileRecord.id);
        }

        // Log the deletion
        await supabase
          .from('file_deletions')
          .insert({
            user_id: user.id,
            bucket_name: bucket,
            file_path: filePath,
            file_name: filePath.split('/').pop(),
            deleted_at: new Date().toISOString(),
            metadata: {
              original_file_record: fileRecord,
              deletion_reason: 'bulk_delete'
            }
          });

        results.push({
          filePath,
          success: true
        });

      } catch (error) {
        results.push({
          filePath,
          success: false,
          error: 'Internal error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `${successCount} files deleted successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results
    });

  } catch (error) {
    console.error('Bulk delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
