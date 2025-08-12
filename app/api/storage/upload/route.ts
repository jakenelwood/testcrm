import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storageManager, StorageBucket, EntityType } from '@/utils/supabase/storage';

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as StorageBucket;
    const entityType = formData.get('entityType') as EntityType;
    const entityId = formData.get('entityId') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket is required' },
        { status: 400 }
      );
    }

    if (!entityType) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }

    if ((entityType === 'lead' || entityType === 'client') && !entityId) {
      return NextResponse.json(
        { error: `Entity ID is required for ${entityType} uploads` },
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

    // Validate entity access
    if (entityType === 'lead' && entityId) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, created_by, assigned_to')
        .eq('id', entityId)
        .single();

      if (leadError || !lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        );
      }

      // Check if user has access to the lead
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const hasAccess = 
        lead.created_by === user.id ||
        lead.assigned_to === user.id ||
        userProfile?.role === 'admin' ||
        userProfile?.role === 'manager';

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this lead' },
          { status: 403 }
        );
      }
    }

    if (entityType === 'client' && entityId) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, created_by')
        .eq('id', entityId)
        .single();

      if (clientError || !client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      // Check if user has access to the client
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const hasAccess = 
        client.created_by === user.id ||
        userProfile?.role === 'admin' ||
        userProfile?.role === 'manager';

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this client' },
          { status: 403 }
        );
      }
    }

    // Upload file using storage manager
    const { data, error } = await storageManager.uploadFile({
      bucket,
      entityType,
      entityId: entityId || undefined,
      file
    });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Upload failed' },
        { status: 500 }
      );
    }

    // Get file URL
    let fileUrl: string | undefined;
    if (bucket === 'user-avatars') {
      // Public bucket
      const { data: urlData } = storageManager.getPublicUrl(bucket, data.path);
      fileUrl = urlData.publicUrl;
    } else {
      // Private bucket - get signed URL
      const { data: urlData, error: urlError } = await storageManager.getSignedUrl(bucket, data.path, 3600);
      if (!urlError && urlData) {
        fileUrl = urlData.signedUrl;
      }
    }

    // Log the upload for audit purposes
    await supabase
      .from('file_uploads')
      .insert({
        user_id: user.id,
        bucket_name: bucket,
        file_path: data.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        entity_type: entityType,
        entity_id: entityId,
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        bucket,
        entityType,
        entityId
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') as StorageBucket;
    const entityType = searchParams.get('entityType') as EntityType;
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket is required' },
        { status: 400 }
      );
    }

    // Build query for file uploads
    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('bucket_name', bucket)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data: uploads, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    // Generate URLs for files
    const filesWithUrls = await Promise.all(
      uploads.map(async (upload) => {
        let fileUrl: string | undefined;
        
        if (bucket === 'user-avatars') {
          // Public bucket
          const { data: urlData } = storageManager.getPublicUrl(bucket, upload.file_path);
          fileUrl = urlData.publicUrl;
        } else {
          // Private bucket - get signed URL
          const { data: urlData, error: urlError } = await storageManager.getSignedUrl(
            bucket, 
            upload.file_path, 
            3600
          );
          if (!urlError && urlData) {
            fileUrl = urlData.signedUrl;
          }
        }

        return {
          ...upload,
          url: fileUrl
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: filesWithUrls,
      pagination: {
        limit,
        offset,
        total: uploads.length
      }
    });

  } catch (error) {
    console.error('List files API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
