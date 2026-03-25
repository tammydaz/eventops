import { STAFFING_CONFIRMED_FIELD_ID } from "../services/airtable/events";
import { isDeliveryOrPickup } from "./deliveryHelpers";

export type StaffingPillState = "attention" | "confirmed" | "hidden";

/** Whether to show amber warning, green check, or nothing on calendar / list cards. */
export function getStaffingPillState(e: {
  eventType?: string;
  isDemo?: boolean;
  staffingConfirmedInNowsta?: boolean;
  fwStaffSummaryPresent?: boolean;
}): StaffingPillState {
  if (e.isDemo) return "hidden";
  if (isDeliveryOrPickup(e.eventType)) return "hidden";
  if (STAFFING_CONFIRMED_FIELD_ID) {
    if (e.staffingConfirmedInNowsta === true) return "confirmed";
    return "attention";
  }
  if (e.fwStaffSummaryPresent === undefined) return "hidden";
  if (e.fwStaffSummaryPresent) return "confirmed";
  return "attention";
}

/** @deprecated use getStaffingPillState === "attention" */
export function eventNeedsStaffingAttention(e: Parameters<typeof getStaffingPillState>[0]): boolean {
  return getStaffingPillState(e) === "attention";
}

export function staffingAttentionTitle(): string {
  if (STAFFING_CONFIRMED_FIELD_ID) {
    return "Staffing not confirmed — verify shifts in Nowsta, then check Confirmed in Nowsta in BEO intake.";
  }
  return "On-site event: add an FW Staff line in BEO intake.";
}

export function staffingConfirmedTitle(): string {
  return "Staffing confirmed for this event (Nowsta).";
}
