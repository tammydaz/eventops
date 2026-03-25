import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../state/authStore";
import { DepartmentHeader } from "./DepartmentHeader";
import { IntakeFOHCommandProvider } from "../context/IntakeFOHCommandContext";
import { IntakeFOHCommandTop } from "./IntakeFOHCommandTop";
import "../pages/DashboardPage.css";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";

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
  /** Full-width main area with no left sidebar (e.g. Intake/FOH command layout) */
  hideSidebar?: boolean;
};

export function DepartmentLayout({ title, navItems, children, departmentContext, headerActions, hideSidebar }: DepartmentLayoutProps) {
  const { pathname } = useLocation();
  const dashboardNavActive = pathname === "/" || pathname.startsWith("/home");
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Reset mobile nav overlay when viewport becomes desktop — prevents stuck haze
  useEffect(() => {
    const check = () => {
      if (window.innerWidth > 768) setMobileNavOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className={`dp-container ${hideSidebar ? "dp-container--no-sidebar dp-container-command" : ""}`.trim()}>
      {/* Sidebar — matches Dashboard exactly */}
      {!hideSidebar && (
      <aside className="dp-sidebar">
        <Link to={DASHBOARD_CALENDAR_TO} className="dp-logo-section" style={{ textDecoration: "none" }}>
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
            <NavLink
              to={DASHBOARD_CALENDAR_TO}
              className={() => `dp-nav-link ${dashboardNavActive ? "active" : ""}`}
            >
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
      )}

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
            <NavLink
              to={DASHBOARD_CALENDAR_TO}
              className={() => `dp-nav-link ${dashboardNavActive ? "active" : ""}`}
              onClick={() => setMobileNavOpen(false)}
            >
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

      {/* Main — embedded header (dept pages) or full Werx command top (Intake/FOH) */}
      <main className="dp-main">
        {hideSidebar ? (
          <IntakeFOHCommandProvider>
            <IntakeFOHCommandTop onOpenMobileMenu={() => setMobileNavOpen(true)} />
            <div
              className="dp-events-area dp-events-area--no-sidebar"
              style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}
            >
              {children}
            </div>
          </IntakeFOHCommandProvider>
        ) : (
          <>
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
            <div
              className="dp-events-area"
              style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}
            >
              {children}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
