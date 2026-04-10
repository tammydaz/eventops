import type { CSSProperties } from "react";
import { usePickerStore } from "../../state/usePickerStore";
import { DELIVERY_INTAKE_SECTIONS } from "../../services/airtable/menuCatalogConfig";
import { DELIVERY_INTAKE_TARGET_FIELD } from "../../services/airtable/menuItems";

const INTAKE_PILL_COLORS: Record<string, string> = {
  disposable_hot: "#ef4444",
  disposable_ready: "#f97316",
  disposable_bulk: "#26a69a",
  disposable_display: "#3b82f6",
};

const SHORT_LABEL: Record<string, string> = {
  disposable_hot: "+ Disp. Hot",
  disposable_ready: "+ Disp. Ready",
  disposable_bulk: "+ Disp. Bulk",
  disposable_display: "+ Disp. Display",
};

const fullServePillButton = (color: string, disabled: boolean): CSSProperties => ({
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: `1px solid ${color}80`,
  background: `linear-gradient(135deg, ${color}40, ${color}15)`,
  color,
  cursor: disabled ? "default" : "pointer",
  flexShrink: 0,
});

/**
 * Compact category row for delivery intake — matches full-service BEO pill styling.
 */
export function DeliveryIntakeMenuAddRow(props: {
  disabled: boolean;
  /** Scroll target for "+ Boxed lunches" */
  boxedAnchorId?: string;
  /** Called before scroll so parent can mount boxed-lunch UI (e.g. first open). */
  onOpenBoxedLunches?: () => void;
  onOpenSandwichPlatters: () => void;
}) {
  const { disabled, boxedAnchorId = "beo-delivery-boxed-lunch", onOpenBoxedLunches, onOpenSandwichPlatters } = props;
  const openPicker = usePickerStore((s) => s.openPicker);

  return (
    <div
      className="beo-menu-add-buttons"
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "20px",
        overflowX: "auto",
        paddingBottom: "4px",
        alignItems: "flex-start",
      }}
    >
      {DELIVERY_INTAKE_SECTIONS.map((sec) => {
        const color = INTAKE_PILL_COLORS[sec.id] ?? "#94a3b8";
        const label = SHORT_LABEL[sec.id] ?? `+ ${sec.title}`;
        return (
          <button
            key={sec.id}
            type="button"
            disabled={disabled}
            onClick={() =>
              openPicker(`delivery_intake_${sec.id}`, DELIVERY_INTAKE_TARGET_FIELD, `Add — ${sec.title}`)
            }
            style={fullServePillButton(color, disabled)}
          >
            {label}
          </button>
        );
      })}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onOpenBoxedLunches?.();
          requestAnimationFrame(() =>
            document.getElementById(boxedAnchorId)?.scrollIntoView({ behavior: "smooth", block: "start" })
          );
        }}
        style={fullServePillButton("#22c55e", disabled)}
      >
        + Boxed lunches
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onOpenSandwichPlatters}
        style={fullServePillButton("#f97316", disabled)}
      >
        + Sandwich platters
      </button>
    </div>
  );
}
