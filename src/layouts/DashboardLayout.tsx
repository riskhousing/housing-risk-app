import { NavLink, Outlet } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../providers/AuthProvider";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-extrabold text-white ring-1 ring-white/15">
              R
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">RIDHAH PH</div>
              <div className="text-xs text-white/60">Risk Intake & Decision Support</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-white">{user?.displayName ?? "User"}</div>
              <div className="text-xs text-white/60">{user?.email ?? ""}</div>
            </div>

            <button
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 gap-6 pb-10">
          {/* Sidebar */}
          <aside className="hidden w-72 shrink-0 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 md:block">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Navigation</div>

            <nav className="mt-4 space-y-2">
              <NavLink
                to="/app/questionnaire"
                className={({ isActive }) =>
                  cx(
                    "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/30" : "text-white/75 hover:bg-white/5"
                  )
                }
              >
                Questionnaire
              </NavLink>

              <NavLink
                to="/app/summary"
                className={({ isActive }) =>
                  cx(
                    "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/30" : "text-white/75 hover:bg-white/5"
                  )
                }
              >
                Summary
              </NavLink>
            </nav>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              Tip: Use <span className="font-semibold text-white/80">Summary</span> to sort and review saved submissions.
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-7">
            <Outlet />
          </main>
        </div>

        <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} RIDHAH PH. All rights reserved.
        </footer>
      </div>
    </AppShell>
  );
}
