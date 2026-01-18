import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace state={{ from: loc.pathname }} />;

  return <>{children}</>;
}
