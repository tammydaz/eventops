import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { canAccessRoute } from "../lib/auth";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import LoginPage from "../pages/LoginPage";

const LOGIN_PATH = "/login";

/** Set to true to require login. Set to false for open access (practice mode). */
const AUTH_REQUIRED = true;

const DEMO_USER = { id: "demo", name: "Practice Mode", role: "ops_admin" as const };

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const effectiveUser = user ?? (AUTH_REQUIRED ? null : DEMO_USER);
  const effectiveAuth = isAuthenticated || !AUTH_REQUIRED;

  // Allow login page without auth (only when auth is required)
  if (pathname === LOGIN_PATH || pathname.startsWith("/login")) {
    if (AUTH_REQUIRED && isAuthenticated) {
      navigate("/", { replace: true });
      return null;
    }
    if (AUTH_REQUIRED) {
      return <LoginPage />;
    }
    navigate("/", { replace: true });
    return null;
  }

  // Not authenticated - redirect to login (only when auth is required)
  if (AUTH_REQUIRED && (!isAuthenticated || !user)) {
    navigate(LOGIN_PATH + "?redirect=" + encodeURIComponent(pathname), { replace: true });
    return null;
  }

  // Check permission for this route
  if (effectiveUser && !canAccessRoute(effectiveUser.role, pathname)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-4">You don&apos;t have permission to view this page.</p>
        <button
          onClick={() => navigate(DASHBOARD_CALENDAR_TO)}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Go to your dashboard
        </button>
        {AUTH_REQUIRED && (
          <button
            onClick={() => { logout(); navigate(LOGIN_PATH); }}
            className="mt-3 text-sm text-slate-500 hover:text-white"
          >
            Sign out
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
