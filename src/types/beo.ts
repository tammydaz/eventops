/**
 * BEO TypeScript Type Definitions
 * Interfaces for the BEO print engine and data service.
 */

// ── Menu Item ─────────────────────────────────────────────────────────────────

export interface SpecOverrides {
  /** Manual quantity override */
  qty?: string;
  /** Manual pan type override */
  panType?: string;
  /** Manual serving vessel override */
  servingVessel?: string;
  /** Prep notes override */
  notes?: string;
}

export interface MenuItem {
  /** Airtable record ID */
  id: string;
  /** Display name (from formula field) */
  name: string;
  /** Section this item belongs to */
  section: string;
  /** Auto-calculated spec line (from Print – Spec Line formula) */
  autoSpec: string;
  /** Manual spec overrides */
  specOverride?: SpecOverrides;
  /** Allergen icon emojis */
  allergens: string[];
  /** Child items (sauces / components) */
  children: MenuItem[];
  /** Whether this item is a sauce */
  isSauce: boolean;
  /** Whether this sauce stands alone (not indented under parent) */
  standAloneSauce: boolean;
  /** Prep notes */
  notes?: string;
  /** Kitchen tasks */
  kitchenTasks?: string;
  /** Service type */
  serviceType?: string;
  /** Parent item record ID (if this item is a child) */
  parentId?: string;
}

// ── Event Data ────────────────────────────────────────────────────────────────

export interface EventData {
  /** Formula job number / event name (READ ONLY) */
  jobNumber: string;
  /** Client first name */
  clientFirstName: string;
  /** Client last name */
  clientLastName: string;
  /** Full client display name */
  clientDisplay: string;
  /** Client phone */
  clientPhone: string;
  /** Venue name */
  venueName: string;
  /** Venue / event location address */
  eventLocation: string;
  /** City and state */
  venueCity: string;
  /** Event date */
  eventDate: string;
  /** Guest count */
  guestCount: string;
  /** Event start time */
  eventStartTime: string;
  /** Event end time */
  eventEndTime: string;
  /** FoodWerx arrival time */
  eventArrivalTime: string;
  /** Dispatch time */
  dispatchTime: string;
  /** Service style */
  serviceStyle: string;
  /** Dietary / allergy notes */
  dietaryNotes: string;
  /** Special / ops notes */
  specialNotes: string;
}

// ── Menu Selections ───────────────────────────────────────────────────────────

export interface MenuSelectionIds {
  passedAppetizers: string[];
  presentedAppetizers: string[];
  buffetMetal: string[];
  buffetChina: string[];
  desserts: string[];
  beverages: string[];
}

// ── BEO Data ──────────────────────────────────────────────────────────────────

export interface BeoData {
  /** Event header and detail fields */
  event: EventData;
  /** Menu items organized by section with parent-child relationships resolved */
  menuSections: {
    passedAppetizers: MenuItem[];
    presentedAppetizers: MenuItem[];
    buffetMetal: MenuItem[];
    buffetChina: MenuItem[];
    desserts: MenuItem[];
    beverages: MenuItem[];
  };
  /** Raw linked record IDs for each section */
  selectionIds: MenuSelectionIds;
}

// ── BEO Print View Modes ──────────────────────────────────────────────────────

/** The three BEO print view modes */
export type BeoViewMode = "kitchen" | "spec" | "packout";

// ── Spec Lock State ───────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";
