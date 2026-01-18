import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
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

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmailPassword, signupWithEmailPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Already signed in
  if (user) {
    navigate("/app/questionnaire");
  }

  async function onGoogle() {
    setErr(null);
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate("/app/questionnaire");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // remember checkbox is UI for now (Firebase default persistence already “remember me”)
      if (mode === "login") {
        await loginWithEmailPassword(email, password);
      } else {
        await signupWithEmailPassword(email, password);
      }
      navigate("/app/questionnaire");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* top */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-extrabold text-white ring-1 ring-white/15">
              R
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">RIDHAH PH</div>
              <div className="text-xs text-white/60">
                Risk Index and Description for Heritage and Ancestral Houses
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="flex flex-1 items-center justify-center pb-10">
          <div className="w-full max-w-lg rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {mode === "login" ? "Sign in to your account" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {mode === "login"
                  ? "Use your email/password, or continue with Google."
                  : "Create an account using email/password, or continue with Google."}
              </p>
            </div>

            <button
              disabled={busy || loading}
              onClick={onGoogle}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:opacity-60"
              type="button"
            >
              {/* simple google icon */}
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

            <form onSubmit={onSubmit} className="space-y-4">
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

              <button
                disabled={busy || loading}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
                type="submit"
              >
                {busy || loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Log in"
                  : "Sign up"}
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
          </div>
        </main>

        <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} RIDHAH PH. All rights reserved.
        </footer>
      </div>
    </AppShell>
  );
}
