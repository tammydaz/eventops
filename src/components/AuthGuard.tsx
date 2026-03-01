import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { canAccessRoute } from "../lib/auth";
import LoginPage from "../pages/LoginPage";

const LOGIN_PATH = "/login";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Allow login page without auth
  if (pathname === LOGIN_PATH || pathname.startsWith("/login")) {
    if (isAuthenticated) {
      // Already logged in - redirect to home
      navigate("/", { replace: true });
      return null;
    }
    return <LoginPage />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    navigate(LOGIN_PATH + "?redirect=" + encodeURIComponent(pathname), { replace: true });
    return null;
  }

  // Check permission for this route
  if (!canAccessRoute(user.role, pathname)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-4">You don&apos;t have permission to view this page.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Go to your dashboard
        </button>
        <button
          onClick={() => { logout(); navigate(LOGIN_PATH); }}
          className="mt-3 text-sm text-slate-500 hover:text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
