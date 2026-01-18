import { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../providers/AuthProvider";

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <div className="text-xs font-semibold text-white/50">OR</div>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function getFirebaseErrorCode(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const anyErr = e as any;
  return typeof anyErr.code === "string" ? anyErr.code : null;
}

function toFriendlyAuthError(e: unknown): { show: boolean; message?: string } {
  const code = getFirebaseErrorCode(e);

  // Ignore common "non-errors"
  if (code === "auth/popup-closed-by-user") return { show: false };
  if (code === "auth/cancelled-popup-request") return { show: false };

  // Email verification flow
  if (code === "auth/email-not-verified") {
    return {
      show: true,
      message: "Please verify your email first. Check your inbox (and spam), then log in again."
    };
  }
  if (code === "auth/verification-sent") {
    return {
      show: true,
      message: "Verification email sent. Please verify, then log in."
    };
  }

  // Popup blocked is useful but phrase it nicely
  if (code === "auth/popup-blocked") {
    return {
      show: true,
      message: "Popup was blocked by the browser. Please allow popups and try again."
    };
  }

  // Common email/password messages
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return { show: true, message: "Incorrect email or password." };
  }
  if (code === "auth/user-not-found") {
    return { show: true, message: "No account found for that email." };
  }
  if (code === "auth/email-already-in-use") {
    return { show: true, message: "That email is already registered. Try logging in instead." };
  }
  if (code === "auth/weak-password") {
    return { show: true, message: "Password is too weak. Use at least 6 characters." };
  }

  // Fallback
  const raw = e instanceof Error ? e.message : "Sign-in failed. Please try again.";
  return { show: true, message: raw };
}

export default function AuthModal({
  open,
  onClose,
  onAuthed
}: {
  open: boolean;
  onClose: () => void;
  onAuthed?: () => void;
}) {
  const {
    loading,
    loginWithGoogle,
    loginWithEmailPassword,
    signupWithEmailPassword,
    resendEmailVerification
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);

  async function handleGoogle() {
    setErr(null);
    setNeedsVerify(false);
    setBusy(true);
    try {
      await loginWithGoogle();
      onAuthed?.();
      onClose();
    } catch (e) {
      const code = getFirebaseErrorCode(e);
      setNeedsVerify(code === "auth/email-not-verified");
      const friendly = toFriendlyAuthError(e);
      if (friendly.show) setErr(friendly.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setNeedsVerify(false);
    setBusy(true);
    try {
      void remember; // UI only for now
      if (mode === "login") {
        await loginWithEmailPassword(email, password);
        onAuthed?.();
        onClose();
      } else {
        // IMPORTANT: In your AuthProvider, signup should send verification and throw auth/verification-sent
        await signupWithEmailPassword(email, password);

        // If your provider *doesn't* throw, keep this:
        setErr("Verification email sent. Please verify, then log in.");
        setMode("login");
      }
    } catch (e) {
      const code = getFirebaseErrorCode(e);
      setNeedsVerify(code === "auth/email-not-verified");
      const friendly = toFriendlyAuthError(e);
      if (friendly.show) setErr(friendly.message ?? "Sign-in failed.");

      // If we just sent verification, keep the modal open on login mode
      if (code === "auth/verification-sent") {
        setMode("login");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="RIDHAH PH — Sign in">
      <button
        disabled={busy || loading}
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:opacity-60"
        type="button"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.3 14.7 1.2 12 1.2 5.9 1.2 1 6.1 1 12s4.9 10.8 11 10.8c6.4 0 10.6-4.5 10.6-10.8 0-.7-.1-1.2-.2-1.8H12z"
            />
          </svg>
        </span>
        Continue with Google
      </button>

      <Divider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <div className="mb-1 text-sm font-medium text-white/85">Email</div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-medium text-white/85">Password</div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10"
            />
            Remember me
          </label>

          <button
            type="button"
            className="text-sm font-semibold text-indigo-300 hover:text-indigo-200"
            onClick={() => alert("Optional: implement password reset later.")}
          >
            Forgot password?
          </button>
        </div>

        {err ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {needsVerify ? (
          <button
            type="button"
            disabled={busy || loading}
            className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-60"
            onClick={async () => {
              setErr(null);
              try {
                await resendEmailVerification();
                setErr("Verification email resent. Please check your inbox (and spam).");
              } catch (e) {
                const friendly = toFriendlyAuthError(e);
                if (friendly.show) setErr(friendly.message ?? "Could not resend verification email.");
              }
            }}
          >
            Resend verification email
          </button>
        ) : null}

        <button
          disabled={busy || loading}
          className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
          type="submit"
        >
          {busy || loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        <div className="text-center text-sm text-white/60">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-300 hover:text-indigo-200"
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-indigo-300 hover:text-indigo-200"
                onClick={() => setMode("login")}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
