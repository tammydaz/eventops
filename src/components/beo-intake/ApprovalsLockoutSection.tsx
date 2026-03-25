import { useEffect, useState, useCallback } from "react";
import { getLockoutFieldIds, type LockoutFieldIds } from "../../services/airtable/events";
import { FormSection, BEO_SECTION_PILL_ACCENT } from "./FormSection";
import { EventActionButton } from "./EventActionButton";
import { ConfirmLockModal } from "../ConfirmLockModal";
import { useAuthStore } from "../../state/authStore";
import { useEventStore } from "../../state/eventStore";

type ApprovalsLockoutSectionProps = {
  eventId: string | null;
  eventName?: string;
};

export function ApprovalsLockoutSection({ eventId, eventName }: ApprovalsLockoutSectionProps) {
  const [fieldIds, setFieldIds] = useState<LockoutFieldIds | null>(null);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const { user } = useAuthStore();
  const { setFields, loadEventData } = useEventStore();

  useEffect(() => {
    let cancelled = false;
    getLockoutFieldIds().then((ids) => {
      if (!cancelled && ids) setFieldIds(ids);
    });
    return () => { cancelled = true; };
  }, []);

  const role = user?.role ?? null;
  const canHardLock = role === "ops_admin";

  const handleConfirmLock = useCallback(
    async (_initials: string) => {
      if (!eventId || !fieldIds) return;
      await setFields(eventId, {
        [fieldIds.guestCountConfirmed]: true,
        [fieldIds.menuAcceptedByKitchen]: true,
      });
      loadEventData();
      setShowConfirmLock(false);
    },
    [eventId, fieldIds, setFields, loadEventData]
  );

  if (!eventId) return null;
  if (!fieldIds) return null;

  const ids = fieldIds;

  return (
    <FormSection title="Approvals & Lockout Controls" dotColor={BEO_SECTION_PILL_ACCENT}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: "100%", flexWrap: "wrap" }}>
        <EventActionButton
          label="Re-Confirm Guest Count"
          allowedRoles={["foh", "intake", "ops_admin"]}
          updates={{
            [ids.guestCountConfirmed]: true,
            [ids.guestCountChangeApprovedKitchen]: false,
            [ids.guestCountChangeRequested]: false,
          }}
          eventId={eventId}
        />
        <EventActionButton
          label="Approve Guest Count Change (Kitchen)"
          allowedRoles={["kitchen"]}
          updates={{
            [ids.guestCountChangeApprovedKitchen]: true,
            [ids.guestCountConfirmed]: false,
            [ids.guestCountChangeRequested]: false,
          }}
          eventId={eventId}
        />
        <EventActionButton
          label="Approve Menu Change (Kitchen)"
          allowedRoles={["kitchen"]}
          updates={{
            [ids.menuChangeApprovedKitchen]: true,
            [ids.menuAcceptedByKitchen]: false,
            [ids.menuChangeRequested]: false,
          }}
          eventId={eventId}
        />
        <EventActionButton
          label="Re-Accept Menu"
          allowedRoles={["kitchen"]}
          updates={{
            [ids.menuAcceptedByKitchen]: true,
            [ids.menuChangeApprovedKitchen]: false,
          }}
          eventId={eventId}
        />
        {canHardLock && (
          <>
            <button
              type="button"
              onClick={() => setShowConfirmLock(true)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #444",
                backgroundColor: "#1f2937",
                color: "#e0e0e0",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.2s",
                width: "100%",
                maxWidth: "320px",
              }}
            >
              Hard Lock Event
            </button>
            <ConfirmLockModal
              open={showConfirmLock}
              onClose={() => setShowConfirmLock(false)}
              eventName={eventName ?? "This event"}
              onConfirm={handleConfirmLock}
            />
          </>
        )}
      </div>
    </FormSection>
  );
}
