'use client';

import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  hydrate: () => void;
  setSession: (accessToken: string, tenantId: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  tenantId: null,
  hydrate: () => {
    if (typeof window === 'undefined') return;
    set({
      accessToken: sessionStorage.getItem('hrms_at'),
      tenantId: localStorage.getItem('hrms_tid'),
    });
  },
  setSession: (accessToken, tenantId) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hrms_at', accessToken);
      localStorage.setItem('hrms_tid', tenantId);
    }
    set({ accessToken, tenantId });
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hrms_at');
      localStorage.removeItem('hrms_tid');
    }
    set({ accessToken: null, tenantId: null });
  },
}));
