import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { DepartmentHeader } from "./DepartmentHeader";
import "../pages/DashboardPage.css";

type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

type DepartmentContext = "kitchen" | "flair" | "delivery" | "ops_chief" | "intake_foh";

type DepartmentLayoutProps = {
  title?: string;
  navItems: NavItem[];
  children: React.ReactNode;
  /** Department context for header search navigation */
  departmentContext?: DepartmentContext;
  /** Optional header actions (e.g. Sign out, Upload Invoice) */
  headerActions?: React.ReactNode;
};

export function DepartmentLayout({ title, navItems, children, departmentContext, headerActions }: DepartmentLayoutProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="dp-container">
      {/* Sidebar — matches Dashboard exactly */}
      <aside className="dp-sidebar">
        <Link to="/" className="dp-logo-section" style={{ textDecoration: "none" }}>
          <div className="dp-logo-diamond">
            <span className="dp-logo-letter">W</span>
          </div>
          <div>
            <div className="dp-logo-title dp-logo-werx">Werx</div>
            <div className="dp-logo-subtitle">The engine behind the excellence!!</div>
          </div>
        </Link>
        <ul className="dp-nav" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            <NavLink to="/" className={({ isActive }) => `dp-nav-link ${isActive ? "active" : ""}`}>
              <span className="dp-nav-dot" />
              Dashboard
            </NavLink>
          </li>
          {title && (
            <li style={{ marginTop: 16, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, paddingLeft: 12 }}>
                {title}
              </span>
            </li>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`dp-nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="dp-nav-dot" />
                  {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {user && (
          <div className="dp-user-section">
            <span className="dp-user-role">{user.name}</span>
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile nav overlay & drawer — matches Dashboard */}
      <div className={`dp-mobile-nav-overlay ${mobileNavOpen ? "open" : ""}`} onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      <aside className={`dp-mobile-nav-drawer ${mobileNavOpen ? "open" : ""}`}>
        <div className="dp-mobile-nav-header">
          <div className="dp-logo-section">
            <div className="dp-logo-diamond"><span className="dp-logo-letter">W</span></div>
            <div><div className="dp-logo-title dp-logo-werx">Werx</div><div className="dp-logo-subtitle">The engine behind the excellence!!</div></div>
          </div>
          <button type="button" className="dp-mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <ul className="dp-nav">
          <li>
            <NavLink to="/" className={({ isActive }) => `dp-nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileNavOpen(false)}>
              <span className="dp-nav-dot" />
              Dashboard
            </NavLink>
          </li>
          {title && (
            <li style={{ marginTop: 16, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, paddingLeft: 12 }}>
                {title}
              </span>
            </li>
          )}
          {navItems.map((item) => (
            <li key={item.href}>
              <Link to={item.href} className={`dp-nav-link ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`} onClick={() => setMobileNavOpen(false)}>
                <span className="dp-nav-dot" />
                {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <div className="dp-user-section">
            <span className="dp-user-role">{user.name}</span>
            <button type="button" onClick={() => { logout(); window.location.href = "/login"; }} className="dp-signout">Sign out</button>
          </div>
        )}
      </aside>

      {/* Main — matches Dashboard: header inside main, then content */}
      <main className="dp-main">
        <DepartmentHeader
          departmentContext={departmentContext}
          rightActions={headerActions}
          embedded
          leftSlot={
            <button type="button" className="dp-mobile-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          }
        />
        <div className="dp-events-area" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
