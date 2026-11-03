"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./config";
import type { Role } from "@/lib/roles";
import { logAccess } from "./audit";

const LOGIN_LOGGED_KEY = "se7en-monitor-login-logged";

/** Un registro de ingreso por sesión del navegador, no uno por cada recarga. */
function recordLogin(profile: Profile) {
  try {
    if (sessionStorage.getItem(LOGIN_LOGGED_KEY) === profile.id) return;
    sessionStorage.setItem(LOGIN_LOGGED_KEY, profile.id);
  } catch {
    // Sin sessionStorage se registra igual: es preferible a no dejar rastro.
  }
  void logAccess(
    { action: "login" },
    { name: profile.full_name, role: profile.role },
  );
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setProfile(null);
        setProfileReady(!u);
        setAuthReady(true);
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, "profiles", user.uid),
      (snap) => {
        const next = snap.exists()
          ? ({ ...snap.data(), id: snap.id } as Profile)
          : null;
        setProfile(next);
        setProfileReady(true);
        if (next?.active) recordLogin(next);
      },
      (err) => {
        console.error("[auth] no se pudo leer el perfil", err);
        setProfileReady(true);
      },
    );
  }, [user]);

  const value: AuthState = {
    user,
    profile,
    loading: !authReady || !profileReady,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    signOut: () => fbSignOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
