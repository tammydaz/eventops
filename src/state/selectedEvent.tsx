import { createContext, useContext, useMemo, useState } from "react";

export type SelectedEventState = {
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
};

const SelectedEventContext = createContext<SelectedEventState | undefined>(undefined);

export const SelectedEventProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      selectedEventId,
      setSelectedEventId,
    }),
    [selectedEventId]
  );

  return (
    <SelectedEventContext.Provider value={value}>
      {children}
    </SelectedEventContext.Provider>
  );
};

export const useSelectedEvent = (): SelectedEventState => {
  const context = useContext(SelectedEventContext);
  if (!context) {
    throw new Error("SelectedEventProvider is missing.");
  }
  return context;
};
