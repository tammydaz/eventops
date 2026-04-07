/**
 * Auth roles and permissions.
 * Each department has a role, allowed routes, and a landing page.
 */

import { DASHBOARD_CALENDAR_TO } from "./dashboardRoutes";

export type Role =
  | "ops_admin"   // Full access, /watchtower (dispatch time is not editable — use Ops Chief role)
  | "ops_chief"   // Ops Chief / Expediter; may edit dispatch time in intake
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
  ops_admin: ["*"], // all (includes /ops-chief, today's tasks)
  ops_chief: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/ops-chief", "/ops-chief/alerts", "/beo-print", "/kitchen-beo-print", "/event", "/feedback-issues"],
  kitchen: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/kitchen-prep", "/kitchen-beo-print", "/kitchen", "/print-test", "/feedback-issues"],
  logistics: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/delivery-command", "/kitchen-beo-print", "/returned-equipment", "/feedback-issues"],
  intake: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/seed-demo", "/site-visit", "/beo-print", "/kitchen-beo-print", "/intake-foh", "/event", "/feedback-issues"],
  flair: ["/", "/home", "/beo-intake", "/quick-intake", "/invoice-intake", "/returned-equipment", "/beo-print", "/flair", "/feedback-issues"],
  foh: [
    "/foh",
    "/intake-foh",
    "/event",
    "/beo-intake",
    "/client",
    "/delivery/intake",
    "/invoice-intake",
    "/feedback-issues",
  ],
};

/** Landing page path for each role after login. */
export const ROLE_LANDING: Record<Role, string> = {
  ops_admin: DASHBOARD_CALENDAR_TO,
  ops_chief: "/ops-chief",
  kitchen: "/kitchen",
  logistics: "/delivery-command",
  intake: DASHBOARD_CALENDAR_TO,
  flair: "/flair",
  foh: "/intake-foh?eventView=calendar",
};

export function canAccessRoute(role: Role, pathnameOrHref: string): boolean {
  const pathname = pathnameOrHref.split("?")[0];
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

/** Kitchen dispatch clock — editable in intake only for the Ops Chief role. */
export function canEditDispatchTime(role: Role | undefined): boolean {
  return role === "ops_chief";
}

/** @deprecated Use canEditDispatchTime — job # is not gated here. Kept for call-site compatibility. */
export function canEditDispatchAndJobNumber(role: Role | undefined): boolean {
  return canEditDispatchTime(role);
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
