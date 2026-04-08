// src/store/auth.store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,
      login:  (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      update: (partial) => set(s => ({ user: { ...s.user, ...partial } })),
    }),
    { name: "fh-auth", partialize: s => ({ token: s.token, user: s.user }) }
  )
);