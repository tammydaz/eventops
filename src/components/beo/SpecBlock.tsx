/**
 * Spec block for BEO / Kitchen BEO output.
 * Renders under each menu item:
 *   FWX Spec: X Full Pans
 *   Industry Standard: X Full Pans
 *   Unit: Full Pan
 *   Chafers: X
 *   Notes: from Spec_Notes
 */

import React from "react";
import { formatSpecWithUnit } from "../../lib/specs/calculateSpecs";
import type { SpecUnitType } from "../../lib/specs/calculateSpecs";

export type SpecBlockData = {
  fwxSpecValue: number;
  industryValue: number;
  unitType: string;
  chaferCount: number;
  notes: string;
};

type SpecBlockProps = {
  spec: SpecBlockData | null | undefined;
  /** Compact: single line (legacy). Full: block with all fields */
  variant?: "full" | "compact";
  /** For Kitchen: emphasize vessel quantities */
  showVesselQuantities?: boolean;
};

const unitTypeLabel = (u: string): string => {
  if (u === "Full Pan" || u === "Half Pan" || u === "Round Pan" || u === "Quart" || u === "Pieces") return u;
  return u || "—";
};

export function SpecBlock({ spec, variant = "full", showVesselQuantities = false }: SpecBlockProps) {
  if (!spec) return <span style={{ color: "#999" }}>—</span>;

  const unitType = spec.unitType as SpecUnitType;

  if (variant === "compact") {
    return (
      <span>
        {formatSpecWithUnit(spec.fwxSpecValue, unitType)}
      </span>
    );
  }

  const blockStyle: React.CSSProperties = {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#333",
    marginTop: 4,
    paddingLeft: 8,
    borderLeft: "2px solid #e5e7eb",
  };

  return (
    <div style={blockStyle}>
      <div>FWX Spec: {formatSpecWithUnit(spec.fwxSpecValue, unitType)}</div>
      <div>Industry Standard: {formatSpecWithUnit(spec.industryValue, unitType)}</div>
      <div>Unit: {unitTypeLabel(spec.unitType)}</div>
      <div>Chafers: {spec.chaferCount}</div>
      {spec.notes && <div>Notes: {spec.notes}</div>}
    </div>
  );
}
