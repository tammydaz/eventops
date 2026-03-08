import { Link, useLocation } from "react-router-dom";

type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

type DepartmentLayoutProps = {
  title: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export function DepartmentLayout({ title, navItems, children }: DepartmentLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="dept-layout" style={styles.container}>
      <aside className="dept-sidebar" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <Link to="/" style={styles.backLink}>
            ← Dashboard
          </Link>
        </div>
        <h2 style={styles.deptTitle}>{title}</h2>
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                {item.icon && <span style={styles.navIcon}>{item.icon}</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="dept-main" style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
    color: "#e0e0e0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "linear-gradient(180deg, #0f0f0f 0%, #1a0a0a 50%, #0f0505 100%)",
    borderRight: "1px solid rgba(204,0,0,0.2)",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  backLink: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textDecoration: "none",
  },
  backLinkHover: {
    color: "#fff",
  },
  deptTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 20px 0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 8,
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  navItemActive: {
    background: "rgba(204,0,0,0.2)",
    color: "#ff6b6b",
    borderLeft: "3px solid #cc0000",
  },
  navIcon: {
    fontSize: 18,
  },
  main: {
    flex: 1,
    overflow: "auto",
    padding: 24,
  },
};
