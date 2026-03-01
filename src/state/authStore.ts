import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "../lib/auth";

const AUTH_KEY = "eventops-auth";

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
  email?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token: token ?? null, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: AUTH_KEY }
  )
);
