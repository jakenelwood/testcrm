import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function checkAuth() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
      return redirect('/auth/login');
    }
    
    // Return the user data if authenticated
    return data.user;
  } catch (error) {
    console.error('Authentication error:', error);
    return redirect('/auth/login');
  }
}
