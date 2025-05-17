import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  console.log('========== RINGCENTRAL TOKEN API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    let access_token = cookieStore.get('ringcentral_access_token')?.value;
    let refresh_token = cookieStore.get('ringcentral_refresh_token')?.value;
    let token_expiry = cookieStore.get('ringcentral_token_expiry')?.value;

    console.log('Access token available in cookies:', !!access_token);
    console.log('Access token length:', access_token?.length || 0);

    // Check if we have valid tokens in cookies
    let tokensValid = access_token && token_expiry && parseInt(token_expiry) > Date.now();

    // If not in cookies or expired, check the database
    if (!tokensValid) {
      console.log('Tokens not valid in cookies, checking database');
      const supabase = createClient(cookieStore);

      // Get the current user
      const { data, error: userError } = await supabase.auth.getUser();
      console.log('Supabase auth.getUser() response:', {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        error: userError
      });

      const user = data.user;

      if (user) {
        console.log('User found, checking for tokens in database');

        // Get the tokens from the database
        const { data: tokens, error } = await supabase
          .from('ringcentral_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error retrieving tokens from database:', error);
        } else if (tokens) {
          console.log('Tokens found in database');

          // Check if the token is expired
          const expiresAt = new Date(tokens.expires_at);
          const now = new Date();

          if (expiresAt > now) {
            console.log('Database token is valid');

            // Update our local variables
            access_token = tokens.access_token;
            refresh_token = tokens.refresh_token;
            token_expiry = expiresAt.getTime().toString();

            // Store the tokens in cookies for future use
            cookieStore.set('ringcentral_access_token', tokens.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            cookieStore.set('ringcentral_refresh_token', tokens.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            });

            cookieStore.set('ringcentral_token_expiry', expiresAt.getTime().toString(), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            tokensValid = true;
          } else {
            console.log('Database token is expired');
          }
        } else {
          console.log('No tokens found in database');
        }
      } else {
        console.log('No authenticated user found');
      }
    }

    if (!tokensValid) {
      console.log('No valid tokens found');
      console.log('========== RINGCENTRAL TOKEN API - END (NO VALID TOKEN) ==========');
      return NextResponse.json({ error: 'No valid access token' }, { status: 401 });
    }

    console.log('Returning valid access token');
    console.log('========== RINGCENTRAL TOKEN API - END (SUCCESS) ==========');

    return NextResponse.json({
      access_token,
      refresh_token,
      expires_at: token_expiry ? parseInt(token_expiry) : undefined
    });
  } catch (error: any) {
    console.error('Error getting token:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL TOKEN API - END (ERROR) ==========');
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
