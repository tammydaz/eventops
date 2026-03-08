/**
 * Production color & blink helpers.
 * When Hard Lock is clicked, events turn color and blink until each department accepts by clicking.
 * Each department has its own acceptance; kitchen accepting does not stop blink for flair, etc.
 */
import { isDelivery, isPickup } from "./deliveryHelpers";

export type ProductionColor = "grey" | "blue" | "yellow" | "purple";

export type DepartmentKey = "kitchen" | "flair" | "delivery" | "ops_chief";

export function isReadyForProduction(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
}): boolean {
  return item.guestCountConfirmed === true && item.menuAcceptedByKitchen === true;
}

/** Returns true if this department has not yet accepted (event should blink for them). */
export function shouldBlinkForDepartment(
  item: {
    guestCountConfirmed?: boolean;
    menuAcceptedByKitchen?: boolean;
    productionAccepted?: boolean;
    productionAcceptedFlair?: boolean;
    productionAcceptedDelivery?: boolean;
    productionAcceptedOpsChief?: boolean;
  },
  department: DepartmentKey
): boolean {
  if (!isReadyForProduction(item)) return false;
  switch (department) {
    case "kitchen":
      return item.productionAccepted !== true;
    case "flair":
      return item.productionAcceptedFlair !== true;
    case "delivery":
      return item.productionAcceptedDelivery !== true;
    case "ops_chief":
      return item.productionAcceptedOpsChief !== true;
    default:
      return false;
  }
}

/** Legacy: blink if kitchen has not accepted (for Dashboard when no department context). */
export function shouldBlink(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  productionAccepted?: boolean;
}): boolean {
  return isReadyForProduction(item) && item.productionAccepted !== true;
}

export function getProductionColor(
  item: { eventType?: string; guestCountConfirmed?: boolean; menuAcceptedByKitchen?: boolean }
): ProductionColor {
  if (!isReadyForProduction(item)) return "grey";
  const et = (item.eventType ?? "").toLowerCase();
  if (isDelivery(et)) return "yellow";
  if (isPickup(et)) return "purple";
  return "blue";
}

export const PRODUCTION_COLORS: Record<ProductionColor, string> = {
  grey: "#6b7280",
  blue: "#3b82f6",
  yellow: "#eab308",
  purple: "#a855f7",
};
