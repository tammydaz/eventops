/**
 * Production color & blink helpers.
 * Uses Airtable fields when available: beoSentToBOH, productionColor, KitchenBlink, etc.
 * Falls back to computed logic when those fields are absent.
 */
import { isDelivery, isPickup } from "./deliveryHelpers";

export type ProductionColor = "grey" | "blue" | "yellow" | "purple";

export type DepartmentKey = "kitchen" | "flair" | "delivery" | "ops_chief";

/** Defined first to avoid "Cannot access before initialization" in bundled modules. */
export const PRODUCTION_COLORS: Record<ProductionColor, string> = {
  grey: "#6b7280",
  blue: "#00bcd4", /* turquoise for full service */
  yellow: "#eab308",
  purple: "#a855f7",
};

export function isReadyForProduction(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  beoSentToBOH?: boolean;
}): boolean {
  if (item.beoSentToBOH === true) return true;
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
    kitchenBlink?: boolean;
    flairBlink?: boolean;
    deliveryBlink?: boolean;
    opsChiefBlink?: boolean;
  },
  department: DepartmentKey
): boolean {
  if (!isReadyForProduction(item)) return false;
  if (item.kitchenBlink !== undefined || item.flairBlink !== undefined || item.deliveryBlink !== undefined || item.opsChiefBlink !== undefined) {
    switch (department) {
      case "kitchen": return item.kitchenBlink === true;
      case "flair": return item.flairBlink === true;
      case "delivery": return item.deliveryBlink === true;
      case "ops_chief": return item.opsChiefBlink === true;
      default: return false;
    }
  }
  switch (department) {
    case "kitchen": return item.productionAccepted !== true;
    case "flair": return item.productionAcceptedFlair !== true;
    case "delivery": return item.productionAcceptedDelivery !== true;
    case "ops_chief": return item.productionAcceptedOpsChief !== true;
    default: return false;
  }
}

/** Legacy: blink if kitchen has not accepted (for Dashboard when no department context). */
export function shouldBlink(item: {
  guestCountConfirmed?: boolean;
  menuAcceptedByKitchen?: boolean;
  productionAccepted?: boolean;
  kitchenBlink?: boolean;
}): boolean {
  if (!isReadyForProduction(item)) return false;
  if (item.kitchenBlink !== undefined) return item.kitchenBlink === true;
  return item.productionAccepted !== true;
}

/** FOH view: color by event type only. Cards are ALWAYS colored while FOH works on them (before Send to BOH). */
export function getProductionColorForFOH(item: { eventType?: string; beoSentToBOH?: boolean }): ProductionColor {
  if (item.beoSentToBOH === true) return "grey"; // Mini cards in dock are grey
  const et = (item.eventType ?? "").toLowerCase();
  if (isDelivery(et)) return "yellow";
  if (isPickup(et)) return "purple";
  return "blue";
}

/** FOH view: hex for event-type-based color. Returns grey when beoSentToBOH (mini card). */
export function getProductionColorHexForFOH(item: { eventType?: string; beoSentToBOH?: boolean }): string {
  const color = getProductionColorForFOH(item);
  return PRODUCTION_COLORS[color];
}

/** Returns hex color string. Uses productionColor from Airtable when beoSentToBOH; else grey or computed. */
export function getProductionColor(
  item: {
    eventType?: string;
    guestCountConfirmed?: boolean;
    menuAcceptedByKitchen?: boolean;
    beoSentToBOH?: boolean;
    productionColor?: string;
  }
): ProductionColor {
  if (item.beoSentToBOH !== true && !(item.guestCountConfirmed === true && item.menuAcceptedByKitchen === true)) {
    return "grey";
  }
  if (item.productionColor && /^#[0-9a-fA-F]{6}$/.test(item.productionColor)) {
    const hex = item.productionColor.toLowerCase();
    if (hex === "#6b7280") return "grey";
    if (hex === "#3b82f6" || hex === "#00bcd4") return "blue";
    if (hex === "#eab308") return "yellow";
    if (hex === "#a855f7") return "purple";
    return "blue";
  }
  const et = (item.eventType ?? "").toLowerCase();
  if (isDelivery(et)) return "yellow";
  if (isPickup(et)) return "purple";
  return "blue";
}

/** Returns hex string for event card styling. Uses productionColor when available. */
export function getProductionColorHex(
  item: {
    eventType?: string;
    guestCountConfirmed?: boolean;
    menuAcceptedByKitchen?: boolean;
    beoSentToBOH?: boolean;
    productionColor?: string;
  }
): string {
  if (item.beoSentToBOH !== true && !(item.guestCountConfirmed === true && item.menuAcceptedByKitchen === true)) {
    return PRODUCTION_COLORS.grey;
  }
  if (item.productionColor && /^#[0-9a-fA-F]{6}$/.test(item.productionColor)) {
    return item.productionColor;
  }
  const et = (item.eventType ?? "").toLowerCase();
  if (isDelivery(et)) return PRODUCTION_COLORS.yellow;
  if (isPickup(et)) return PRODUCTION_COLORS.purple;
  return PRODUCTION_COLORS.blue;
}

/** True if production is frozen (FOH made post-release changes; BOH must confirm). */
export function isProductionFrozen(item: { productionFrozen?: boolean }): boolean {
  return item.productionFrozen === true;
}

/** True if FOH submitted a client-facing change request (guest count or menu). */
export function isChangeRequested(item: {
  guestCountChangeRequested?: boolean;
  menuChangeRequested?: boolean;
  eventChangeRequested?: boolean;
}): boolean {
  if (item.eventChangeRequested === true) return true;
  return item.guestCountChangeRequested === true || item.menuChangeRequested === true;
}

/** True if this BOH department has not yet confirmed receipt of the change. */
export function needsChangeConfirmation(
  item: {
    guestCountChangeRequested?: boolean;
    menuChangeRequested?: boolean;
    productionAccepted?: boolean;
    productionAcceptedFlair?: boolean;
    productionAcceptedDelivery?: boolean;
    productionAcceptedOpsChief?: boolean;
  },
  department: DepartmentKey
): boolean {
  if (!isChangeRequested(item)) return false;
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

/** True if change is requested and any BOH department has not confirmed. */
export function allBOHConfirmedChange(item: {
  guestCountChangeRequested?: boolean;
  menuChangeRequested?: boolean;
  eventChangeRequested?: boolean;
  productionAccepted?: boolean;
  productionAcceptedFlair?: boolean;
  productionAcceptedDelivery?: boolean;
  productionAcceptedOpsChief?: boolean;
  changeConfirmedByBOH?: boolean;
}): boolean {
  if (!isChangeRequested(item)) return true;
  if (item.changeConfirmedByBOH === true) return true;
  return (
    item.productionAccepted === true &&
    item.productionAcceptedFlair === true &&
    item.productionAcceptedDelivery === true &&
    item.productionAcceptedOpsChief === true
  );
}

/** BOH health: yellow when change requested and not all confirmed, else green. */
export function getHealthBOH(item: {
  guestCountChangeRequested?: boolean;
  menuChangeRequested?: boolean;
  productionAccepted?: boolean;
  productionAcceptedFlair?: boolean;
  productionAcceptedDelivery?: boolean;
  productionAcceptedOpsChief?: boolean;
}): "green" | "yellow" {
  if (isChangeRequested(item) && !allBOHConfirmedChange(item)) return "yellow";
  return "green";
}
