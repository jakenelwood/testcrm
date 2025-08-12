import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const useLogout = () => {
  const router = useRouter();
  const supabase = createClient();

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return logout;
};
