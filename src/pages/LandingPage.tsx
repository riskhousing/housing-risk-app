import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../providers/AuthProvider";

function Feature({
  title,
  desc
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-white/65">{desc}</div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  const primaryLabel = useMemo(() => {
    if (user) return "Open dashboard";
    return loading ? "Loading..." : "Log in";
  }, [user, loading]);

  return (
    <AppShell>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-extrabold text-white ring-1 ring-white/15">
              R
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">RIDHAH PH</div>
            </div>
          </div>

          <button
            disabled={loading}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
            onClick={() => (user ? navigate("/app") : setAuthOpen(true))}
          >
            {primaryLabel}
          </button>
        </header>

        {/* Hero */}
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-5xl">
            <div className="mx-auto flex flex-col items-center text-center">

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                Risk Index for Heritage
                <span className="text-indigo-300"> & Ancestral Houses</span>.
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                Collect standardized building details and model inputs, then review
                submissions in a clean dashboard with a sortable summary.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  disabled={loading}
                  className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
                  onClick={() =>
                    user ? navigate("/app/questionnaire") : setAuthOpen(true)
                  }
                >
                  {user ? "Start new intake" : loading ? "Loading..." : "Get started"}
                </button>

                <button
                  className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                  onClick={() =>
                    user ? navigate("/app/summary") : setAuthOpen(true)
                  }
                >
                  View submissions
                </button>
              </div>

              {/* Feature cards */}
              <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                <Feature
                  title="Standardized Inputs"
                  desc="Includes key risk indicators like fault distance, wind speed, slope, elevation, roof design, and more."
                />
                <Feature
                  title="Clean Summary Table"
                  desc="Sort and review records quickly—ready for exporting and reporting later."
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} RIDHAH PH. All rights reserved.
        </footer>

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onAuthed={() => navigate("/app/questionnaire")}
        />
      </div>
    </AppShell>
  );
}
