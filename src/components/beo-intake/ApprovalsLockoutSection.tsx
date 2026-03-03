import { useEffect, useState } from "react";
import { getLockoutFieldIds, type LockoutFieldIds } from "../../services/airtable/events";
import { FormSection } from "./FormSection";
import { EventActionButton } from "./EventActionButton";

type ApprovalsLockoutSectionProps = {
  eventId: string | null;
};

export function ApprovalsLockoutSection({ eventId }: ApprovalsLockoutSectionProps) {
  const [fieldIds, setFieldIds] = useState<LockoutFieldIds | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLockoutFieldIds().then((ids) => {
      if (!cancelled && ids) setFieldIds(ids);
    });
    return () => { cancelled = true; };
  }, []);

  if (!eventId) return null;
  if (!fieldIds) return null;

  const ids = fieldIds;

  return (
    <FormSection title="Approvals & Lockout Controls" icon="🔒">
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
        <EventActionButton
          label="Hard Lock Event"
          allowedRoles={["ops_admin"]}
          updates={{
            [ids.guestCountConfirmed]: true,
            [ids.menuAcceptedByKitchen]: true,
          }}
          eventId={eventId}
        />
      </div>
    </FormSection>
  );
}
