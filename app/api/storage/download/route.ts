import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { storageManager, StorageBucket } from '@/utils/supabase/storage';

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
    const filePath = searchParams.get('path');
    const download = searchParams.get('download') === 'true';

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

    // Check if user has access to this file
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
      // Admin/Manager can access all files
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

    // Handle public buckets differently
    if (bucket === 'user-avatars') {
      const { data } = storageManager.getPublicUrl(bucket, filePath);
      
      if (download) {
        // Redirect to the public URL for download
        return NextResponse.redirect(data.publicUrl);
      } else {
        // Return the public URL
        return NextResponse.json({
          success: true,
          url: data.publicUrl,
          type: 'public'
        });
      }
    }

    // For private buckets, get signed URL
    const { data, error } = await storageManager.getSignedUrl(bucket, filePath, 300); // 5 minutes

    if (error) {
      console.error('Signed URL error:', error);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    if (download) {
      // Redirect to the signed URL for download
      return NextResponse.redirect(data.signedUrl);
    } else {
      // Return the signed URL
      return NextResponse.json({
        success: true,
        url: data.signedUrl,
        type: 'signed',
        expiresIn: 300
      });
    }

  } catch (error) {
    console.error('Download API error:', error);
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

    // Check access permissions (same logic as GET)
    const pathParts = filePath.split('/');
    const fileOwnerId = pathParts[0];
    
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

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
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Download the file content
    const { data, error } = await storageManager.downloadFile(bucket, filePath);

    if (error) {
      console.error('Download error:', error);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file info from the path
    const fileName = filePath.split('/').pop() || 'download';
    
    // Return the file as a blob
    const arrayBuffer = await data.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': data.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': data.size.toString(),
      },
    });

  } catch (error) {
    console.error('Download POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
