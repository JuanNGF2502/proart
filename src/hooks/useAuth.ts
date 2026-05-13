import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import { useAuthStore } from '@/shared/store/auth-store';

export function useAuth() {
  const { user: storeUser, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch user profile from users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'user',
            name: profile?.name || session.user.email?.split('@')[0] || 'Usuário',
            avatar_url: profile?.avatar_url || null,
          };

          setUser(userData, session.access_token);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'user',
            name: profile?.name || session.user.email?.split('@')[0] || 'Usuário',
            avatar_url: profile?.avatar_url || null,
          };

          setUser(userData, session.access_token);
        } else {
          setUser(null, null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
            const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
            const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          name,
          email,
        });
      }

      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
            await supabase.auth.signOut();
      storeLogout();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  return {
    user: storeUser,
    isAuthenticated,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}