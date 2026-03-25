import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type IntakeFOHStatusFilter = "all" | "confirmed" | "setup";

type IntakeFOHCommandContextValue = {
  barClientFilter: string;
  setBarClientFilter: (v: string) => void;
  barVenueFilter: string;
  setBarVenueFilter: (v: string) => void;
  barStatusFilter: IntakeFOHStatusFilter;
  setBarStatusFilter: (v: IntakeFOHStatusFilter) => void;
};

const IntakeFOHCommandContext = createContext<IntakeFOHCommandContextValue | null>(null);

export function IntakeFOHCommandProvider({ children }: { children: ReactNode }) {
  const [barClientFilter, setBarClientFilter] = useState("all");
  const [barVenueFilter, setBarVenueFilter] = useState("all");
  const [barStatusFilter, setBarStatusFilter] = useState<IntakeFOHStatusFilter>("all");

  const value = useMemo(
    () => ({
      barClientFilter,
      setBarClientFilter,
      barVenueFilter,
      setBarVenueFilter,
      barStatusFilter,
      setBarStatusFilter,
    }),
    [barClientFilter, barVenueFilter, barStatusFilter]
  );

  return <IntakeFOHCommandContext.Provider value={value}>{children}</IntakeFOHCommandContext.Provider>;
}

export function useIntakeFOHCommandFilters() {
  return useContext(IntakeFOHCommandContext);
}
