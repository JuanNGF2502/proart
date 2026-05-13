import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/shared/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      hasPermission: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      },
    }),
    {
      name: "proart-auth",
    }
  )
);
