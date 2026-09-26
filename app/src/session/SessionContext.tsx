import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, loadSession, saveSession, StoredSession } from './store';

type SessionContextValue = {
  session: StoredSession | null;
  /** True until the persisted session has been read from secure storage. */
  loading: boolean;
  signIn: (session: StoredSession) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (session: StoredSession) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((restored) => {
      if (!cancelled) {
        setSession(restored);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      loading,
      signIn: async (next) => {
        await saveSession(next);
        setSession(next);
      },
      signOut: async () => {
        await clearSession();
        setSession(null);
      },
      updateSession: async (next) => {
        await saveSession(next);
        setSession(next);
      },
    }),
    [session, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}
