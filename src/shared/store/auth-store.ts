import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserData {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string | null;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserData, token: string) => void;
  logout: () => void;
  setUser: (user: UserData | null, token: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user: UserData, token: string) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user: UserData | null, token: string | null) => {
        set({ user, token, isAuthenticated: !!user, isLoading: false });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "proart-auth",
    }
  )
);