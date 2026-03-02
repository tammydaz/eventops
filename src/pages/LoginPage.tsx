import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { getLandingForRole, canAccessRoute, type Role } from "../lib/auth";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const base = import.meta.env.VITE_APP_URL || "";

  const handleForgotPassword = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/clear-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to reset");
        return;
      }
      setNeedsPasswordSetup(true);
      setHasPassword(false);
      setPassword("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: "" }),
      });
      let data: { error?: string; details?: string; needsPasswordSetup?: boolean; user?: unknown; token?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.status === 404 ? "Login API not found. Check deployment." : `Server error (${res.status}). Try again.`);
        return;
      }
      if (data.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        return;
      }
      if (!res.ok) {
        if (data.error === "Password required") {
          setHasPassword(true);
          return;
        }
        setError(data.details || data.error || "Login failed");
        return;
      }
      setHasPassword(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg?.includes("fetch") ? "Network error. Try again." : (msg || "Network error. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      let data: { error?: string; details?: string; needsPasswordSetup?: boolean; user?: unknown; token?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.status === 404 ? "Login API not found. Check deployment." : `Server error (${res.status}). Try again.`);
        return;
      }
      if (!res.ok) {
        setError(data.details || data.error || "Login failed");
        return;
      }
      if (data.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setPassword("");
        return;
      }
      const { user, token } = data;
      login(
        { id: user.id, name: user.name, role: user.role as Role, email: user.email },
        token
      );
      const target = redirect && canAccessRoute(user.role, redirect) ? redirect : getLandingForRole(user.role);
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg?.includes("fetch") ? "Network error. Try again." : (msg || "Network error. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: newPassword }),
      });
      let data: { error?: string; details?: string; user?: unknown; token?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.status === 404 ? "API not found. Check deployment." : `Server error (${res.status}). Try again.`);
        return;
      }
      if (!res.ok) {
        setError(data.details || data.error || "Failed to set password");
        return;
      }
      const { user, token } = data;
      login(
        { id: user.id, name: user.name, role: user.role as Role, email: user.email },
        token
      );
      const target = redirect && canAccessRoute(user.role, redirect) ? redirect : getLandingForRole(user.role);
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg?.includes("fetch") ? "Network error. Try again." : (msg || "Network error. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setNeedsPasswordSetup(false);
    setHasPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const showSetPassword = needsPasswordSetup;
  const showPasswordField = hasPassword;
  const showEmailOnly = !showSetPassword && !showPasswordField;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-diamond">
            <span>F</span>
          </div>
          <h1>FOODWERX EVENTOPS</h1>
          <p className="login-subtitle">
            {showSetPassword ? "Set your password" : showPasswordField ? "Enter your password" : "Sign in with your email"}
          </p>
        </div>

        {showSetPassword ? (
          <form onSubmit={handleSetPasswordSubmit} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <div className="login-email-readonly">{email}</div>
            </div>
            <div className="login-field">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="login-input"
                autoComplete="new-password"
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="login-input"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Setting password…" : "Set password & sign in"}
            </button>
            <button type="button" className="login-back" onClick={handleBack}>
              Back
            </button>
          </form>
        ) : showPasswordField ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <div className="login-email-readonly">{email}</div>
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="login-input"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              className="login-forgot"
              onClick={handleForgotPassword}
              disabled={loading}
              style={{ marginTop: 8, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}
            >
              First time or forgot? Set your password here
            </button>
            <button type="button" className="login-back" onClick={handleBack}>
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@foodwerx.com"
                className="login-input"
                autoComplete="email"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {error && (
          <p className="login-hint">Don&apos;t have access? Ask your manager to add you.</p>
        )}
      </div>
    </div>
  );
}
