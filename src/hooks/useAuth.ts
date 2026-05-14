import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/shared/store/auth-store';

export function useAuth() {
  const { user: storeUser, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    // Auto-login as admin - no authentication required
    const autoLogin = () => {
      const userData = {
        id: 'default-user',
        email: 'admin@proart.com',
        role: 'admin',
        name: 'Administrador',
        avatar_url: null,
      };
      setUser(userData, 'dummy-token');
    };

    // Delay slightly to ensure store is ready
    const timer = setTimeout(autoLogin, 100);
    return () => clearTimeout(timer);
  }, [setUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Dummy login - always succeeds
    const userData = {
      id: 'default-user',
      email: email || 'admin@proart.com',
      role: 'admin',
      name: 'Administrador',
      avatar_url: null,
    };
    setUser(userData, 'dummy-token');
    return { data: { user: userData }, error: null };
  }, [setUser]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    // Dummy signup - always succeeds
    const userData = {
      id: 'default-user',
      email: email || 'admin@proart.com',
      role: 'admin',
      name: name || 'Administrador',
      avatar_url: null,
    };
    setUser(userData, 'dummy-token');
    return { data: { user: userData }, error: null };
  }, [setUser]);

  const signOut = useCallback(async () => {
    // Re-login after logout
    const userData = {
      id: 'default-user',
      email: 'admin@proart.com',
      role: 'admin',
      name: 'Administrador',
      avatar_url: null,
    };
    setUser(userData, 'dummy-token');
  }, [setUser]);

  const resetPassword = useCallback(async () => {
    return { error: null };
  }, []);

  return {
    user: storeUser,
    isAuthenticated: true,
    loading: false,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}