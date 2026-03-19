/**
 * Auth roles and permissions.
 * Each department has a role, allowed routes, and a landing page.
 */

export type Role =
  | "ops_admin"   // Full access, Watchtower, can edit dispatch/job#
  | "ops_chief"   // Ops Chief / Expediter, can edit dispatch/job#
  | "kitchen"     // Kitchen + Open Event
  | "logistics"   // Delivery/Fleet + Open Event
  | "intake"      // Central Command (intake, quick intake, invoice)
  | "flair"       // Flair/Equipment
  | "foh";        // Front of House

export const ROLE_LABELS: Record<Role, string> = {
  ops_admin: "Ops Admin",
  ops_chief: "Ops Chief",
  kitchen: "Kitchen",
  logistics: "Logistics / Fleet",
  intake: "Central Command / Intake",
  flair: "Flair / Equipment",
  foh: "Front of House",
};

/** Routes each role can access. ops_admin can access all. */
export const ROLE_ROUTES: Record<Role, string[]> = {
  ops_admin: ["*"], // all (includes /ops-chief, /watchtower)
  ops_chief: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/ops-chief", "/ops-chief/alerts", "/beo-print", "/kitchen-beo-print", "/event", "/feedback-issues"],
  kitchen: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/kitchen-prep", "/kitchen-beo-print", "/kitchen", "/print-test", "/feedback-issues"],
  logistics: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/delivery-command", "/kitchen-beo-print", "/returned-equipment", "/feedback-issues"],
  intake: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/seed-demo", "/site-visit", "/beo-print", "/kitchen-beo-print", "/intake-foh", "/event", "/feedback-issues"],
  flair: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/returned-equipment", "/beo-print", "/flair", "/feedback-issues"],
  foh: ["/foh", "/intake-foh", "/event", "/invoice-intake", "/feedback-issues"],
};

/** Landing page path for each role after login. */
export const ROLE_LANDING: Record<Role, string> = {
  ops_admin: "/",
  ops_chief: "/ops-chief",
  kitchen: "/kitchen",
  logistics: "/delivery-command",
  intake: "/",
  flair: "/flair",
  foh: "/intake-foh",
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

/** Only Ops Chief and Watchtower (ops_admin) can set dispatch time and job #; everyone else sees read-only. */
export function canEditDispatchAndJobNumber(role: Role | undefined): boolean {
  return role === "ops_admin" || role === "ops_chief";
}

/** Department circle IDs each role can see. ops_admin sees all. */
export const ROLE_DEPARTMENTS: Record<Role, string[]> = {
  ops_admin: ["kitchen", "logistics", "intake", "intake_foh", "flair"],
  ops_chief: ["ops_chief"],
  kitchen: ["kitchen"],
  logistics: ["logistics"],
  intake: ["intake"],
  flair: ["flair"],
  foh: ["intake_foh"],
};
