import { getStaffingPillState, staffingAttentionTitle, staffingConfirmedTitle } from "../lib/staffingCalendar";

/** Link to Nowsta scheduling — matches BEO HeaderSection */
const NOWSTA_URL = "https://app.nowsta.com";

export type StaffingAttentionEventFields = {
  eventType?: string;
  isDemo?: boolean;
  staffingConfirmedInNowsta?: boolean;
  fwStaffSummaryPresent?: boolean;
};

/** Amber “Staff” when needs action; green “✓ Staff” when confirmed (on-site events). */
export function StaffingAttentionBadge({
  event,
  className = "dp-staffing-attention-badge",
  linkNowsta = false,
}: {
  event: StaffingAttentionEventFields;
  className?: string;
  /** When true, pill opens Nowsta in a new tab (use stopPropagation on host card). */
  linkNowsta?: boolean;
}) {
  const state = getStaffingPillState(event);
  if (state === "hidden") return null;

  if (linkNowsta) {
    const label = state === "confirmed" ? "✓ Staff" : "Staff";
    const title = state === "confirmed" ? staffingConfirmedTitle() : staffingAttentionTitle();
    return (
      <a
        href={NOWSTA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${state === "confirmed" ? "dp-staffing-confirmed-badge" : ""} dp-staffing-nowsta-link`}
        title={`${title} — open Nowsta`}
        aria-label={state === "confirmed" ? "Staffing confirmed — open Nowsta" : "Staffing — open Nowsta"}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    );
  }

  if (state === "confirmed") {
    return (
      <span className={`${className} dp-staffing-confirmed-badge`} title={staffingConfirmedTitle()} aria-label="Staffing confirmed">
        ✓ Staff
      </span>
    );
  }
  return (
    <span className={className} title={staffingAttentionTitle()}>
      Staff
    </span>
  );
}
