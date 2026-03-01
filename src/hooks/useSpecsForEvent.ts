import { useState, useEffect, useCallback } from "react";
import { calculateSpecsForEvent, formatSpecForDisplay } from "../lib/specs/calculateSpecs";

export type SpecItemData = {
  fwxSpecValue: number;
  industryValue: number;
  unitType: string;
  chaferCount: number;
  notes: string;
  display: string;
};

export type SpecMap = Record<string, SpecItemData>;

export function useSpecsForEvent(eventId: string | null): {
  specMap: SpecMap;
  specItems: SpecItemData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [specMap, setSpecMap] = useState<SpecMap>({});
  const [specItems, setSpecItems] = useState<SpecItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecs = useCallback(async () => {
    if (!eventId) {
      console.warn("[Specs] No eventId, skipping fetch");
      setSpecMap({});
      setSpecItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await calculateSpecsForEvent(eventId);
      if ("error" in result) {
        console.warn("[Specs] Error:", result.message);
        setError(result.message ?? "Failed to load specs");
        setSpecMap({});
        setSpecItems([]);
      } else {
        console.log("[Specs] Loaded", result.items.length, "items for event", eventId);
        const map: SpecMap = {};
        const items: SpecItemData[] = [];
        for (const item of result.items) {
          const display = formatSpecForDisplay(item.fwxSpecValue, item.unitType);
          const data: SpecItemData = {
            fwxSpecValue: item.fwxSpecValue,
            industryValue: item.industryValue,
            unitType: item.unitType,
            chaferCount: item.chaferCount,
            notes: item.notes ?? "",
            display,
          };
          map[item.itemId] = data;
          items.push(data);
        }
        setSpecMap(map);
        setSpecItems(items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load specs");
      setSpecMap({});
      setSpecItems([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  return { specMap, specItems, loading, error, refetch: fetchSpecs };
}
