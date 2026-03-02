/**
 * Auth roles and permissions.
 * Each department has a role, allowed routes, and a landing page.
 */

export type Role =
  | "ops_admin"   // Full access, Dashboard landing
  | "kitchen"     // Kitchen + Open Event
  | "logistics"   // Delivery/Fleet + Open Event
  | "intake"      // Central Command (intake, quick intake, invoice)
  | "flair"       // Flair/Equipment
  | "foh";        // Front of House

export const ROLE_LABELS: Record<Role, string> = {
  ops_admin: "Ops Admin",
  kitchen: "Kitchen",
  logistics: "Logistics / Fleet",
  intake: "Central Command / Intake",
  flair: "Flair / Equipment",
  foh: "Front of House",
};

/** Routes each role can access. ops_admin can access all. */
export const ROLE_ROUTES: Record<Role, string[]> = {
  ops_admin: ["*"], // all
  kitchen: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/kitchen-prep", "/kitchen-beo-print", "/print-test", "/feedback-issues"],
  logistics: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/delivery-command", "/returned-equipment", "/feedback-issues"],
  intake: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/seed-demo", "/site-visit", "/feedback-issues"],
  flair: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/returned-equipment", "/feedback-issues"],
  foh: ["/foh", "/invoice-intake", "/feedback-issues"],
};

/** Landing page path for each role after login. All employees land on Dashboard to see sidebar + Add Event. */
export const ROLE_LANDING: Record<Role, string> = {
  ops_admin: "/",
  kitchen: "/",
  logistics: "/",
  intake: "/",
  flair: "/",
  foh: "/foh",
};

export function canAccessRoute(role: Role, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role];
  if (allowed.includes("*")) return true;
  return allowed.some((route) => {
    if (route === "/") return pathname === "/" || pathname.startsWith("/home");
    return pathname === route || pathname.startsWith(route + "/");
  });
}

export function getLandingForRole(role: Role): string {
  return ROLE_LANDING[role];
}

/** Department circle IDs each role can see. ops_admin sees all. */
export const ROLE_DEPARTMENTS: Record<Role, string[]> = {
  ops_admin: ["kitchen", "logistics", "intake", "flair"],
  kitchen: ["kitchen"],
  logistics: ["logistics"],
  intake: ["intake"],
  flair: ["flair"],
  foh: [],
};
