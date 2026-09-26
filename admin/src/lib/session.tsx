'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthTokens, AuthUser } from '@fip/shared';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

interface SessionState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
  hydrated: boolean;
  isPressTeam: boolean;
}

const SessionContext = createContext<SessionState | null>(null);

const STORAGE_KEY = 'fip-admin-session';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { tokens: AuthTokens; user: AuthUser };
      setTokens(parsed.tokens);
      setUser(parsed.user);
    }
    setHydrated(true);
  }, []);

  const persist = (tokens: AuthTokens | null, user: AuthUser | null) => {
    setTokens(tokens);
    setUser(user);
    if (tokens && user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const apiFetch = useMemo(
    () =>
      async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          ...(init.headers as Record<string, string>),
        };
        if (tokens) headers.authorization = `Bearer ${tokens.accessToken}`;
        const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
        if (res.status === 401 && tokens?.refreshToken) {
          const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });
          if (refreshed.ok) {
            const next = (await refreshed.json()) as AuthTokens;
            persist(next, user);
            headers.authorization = `Bearer ${next.accessToken}`;
            const retried = await fetch(`${API_BASE}${path}`, { ...init, headers });
            if (retried.ok) return (await retried.json()) as T;
          }
          persist(null, null);
          router.push('/login');
        }
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(detail.message ?? `Request failed (${res.status})`);
        }
        return (await res.json()) as T;
      },
    [tokens, user],
  );

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const auth = (await res.json()) as AuthTokens;
    const payload = JSON.parse(atob(auth.accessToken.split('.')[1])) as {
      sub: string;
      email: string;
      role: AuthUser['role'];
    };
    const nextUser: AuthUser = { id: payload.sub, email: payload.email, name: payload.email, role: payload.role };
    persist(auth, nextUser);
    if (payload.role !== 'PRESS_TEAM') {
      persist(null, null);
      throw new Error('Access restricted to press team roles');
    }
   };

  const logout = () => {
    persist(null, null);
    router.push('/login');
  };

  return (
    <SessionContext.Provider
      value={{ tokens, user, login, logout, apiFetch, hydrated, isPressTeam: user?.role === 'PRESS_TEAM' }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
