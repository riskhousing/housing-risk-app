import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  type User
} from "firebase/auth";
import { auth } from "../firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signupWithEmailPassword: (email: string, password: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isEmailPasswordUser(u: User) {
  return u.providerData.some((p) => p.providerId === "password");
}

// ✅ Wake Render backend after login so it doesn't cold-start on /predict
async function warmBackend() {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) return;

  const url = `${base.replace(/\/$/, "")}/health`;

  try {
    await fetch(url, { cache: "no-store" });
  } catch {
    // ignore – server may still be waking up
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);

        // fire-and-forget warmup
        void warmBackend();
      },

      loginWithEmailPassword: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        // Enforce verification ONLY for password accounts
        if (isEmailPasswordUser(cred.user)) {
          await reload(cred.user); // ensure latest emailVerified
          if (!cred.user.emailVerified) {
            await signOut(auth);
            const err: any = new Error("Email not verified.");
            err.code = "auth/email-not-verified";
            throw err;
          }
        }

        // ✅ only warm backend after we know login is allowed
        void warmBackend();
      },

      signupWithEmailPassword: async (email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        // Keep them signed out until verified (more “strict” / client-ready)
        await signOut(auth);
        const err: any = new Error("Verification email sent.");
        err.code = "auth/verification-sent";
        throw err;
      },

      resendEmailVerification: async () => {
        if (!auth.currentUser) return;
        await sendEmailVerification(auth.currentUser);
      },

      logout: async () => {
        await signOut(auth);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
