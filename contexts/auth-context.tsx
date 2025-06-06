'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type User = any; // Replace with your actual User type

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          setError(error.message);
          setUser(null);
        } else if (data?.user) {
          setUser(data.user);
          setError(null);
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error in auth context:', err);
        setError('An unexpected error occurred');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Call getUser immediately
    getUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setError(null);
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
          router.refresh();
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          setError(null);
          router.refresh();
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
