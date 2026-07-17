import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { ensureLocalProfile, fullSync, seedDefaults } from '../sync/syncEngine';
import type { Persona, UserProfile } from '@buddy/shared';
import { getProfile } from '../sync/localDb';
import { updatePersona } from '../sync/syncEngine';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  demoMode: boolean;
  signInGoogle: () => Promise<void>;
  signInDemo: () => Promise<void>;
  logout: () => Promise<void>;
  setPersona: (persona: Persona) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const DEMO_UID = 'demo-local-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

  const bootstrap = useCallback(async (uid: string, email: string | null, name: string | null) => {
    const p = await ensureLocalProfile(uid, email, name);
    await seedDefaults(uid);
    await fullSync(uid);
    const fresh = (await getProfile(uid)) ?? p;
    setProfile(fresh);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      void (async () => {
        await bootstrap(DEMO_UID, 'demo@buddy.local', 'Demo Learner');
        setDemoMode(true);
        setLoading(false);
      })();
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      void (async () => {
        setUser(u);
        if (u) {
          setDemoMode(false);
          await bootstrap(u.uid, u.email, u.displayName);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });
    return () => unsub();
  }, [bootstrap]);

  const signInDemo = useCallback(async () => {
    if (isFirebaseConfigured) {
      try {
        await signInAnonymously(getFirebaseAuth());
        return;
      } catch (err) {
        console.warn('[Buddy Auth] Anonymous sign-in failed, using local coach session:', err);
      }
    }
    setDemoMode(true);
    setUser(null);
    await bootstrap(DEMO_UID, 'demo@buddy.local', 'Demo Learner');
  }, [bootstrap]);

  const signInGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      await bootstrap(DEMO_UID, 'demo@buddy.local', 'Demo Learner');
      setDemoMode(true);
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (err) {
      console.error('[Buddy Auth] Google sign-in failed:', err);
      throw err instanceof Error ? err : new Error('Google sign-in failed');
    }
  }, [bootstrap]);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && user) {
      await signOut(getFirebaseAuth());
    }
    setUser(null);
    setProfile(null);
    setDemoMode(!isFirebaseConfigured);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    const uid = user?.uid ?? (demoMode ? DEMO_UID : null);
    if (!uid) return;
    setProfile((await getProfile(uid)) ?? null);
  }, [user, demoMode]);

  const setPersona = useCallback(
    async (persona: Persona) => {
      const uid = user?.uid ?? (demoMode ? DEMO_UID : null);
      if (!uid) return;
      const next = await updatePersona(uid, persona);
      setProfile(next);
    },
    [user, demoMode],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      demoMode,
      signInGoogle,
      signInDemo,
      logout,
      setPersona,
      refreshProfile,
    }),
    [user, profile, loading, demoMode, signInGoogle, signInDemo, logout, setPersona, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUserId() {
  const { user, demoMode, profile } = useAuth();
  return user?.uid ?? (demoMode ? profile?.uid ?? DEMO_UID : null);
}
