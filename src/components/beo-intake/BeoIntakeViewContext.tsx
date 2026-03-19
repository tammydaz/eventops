import { createContext, useContext, type ReactNode } from "react";

export type BeoIntakeViewContextValue = {
  inBeoView: boolean;
  /** When inBeoView, section is controlled by parent; undefined = use internal state */
  controlledOpen?: boolean;
  onToggle?: () => void;
};

const defaultValue: BeoIntakeViewContextValue = { inBeoView: false };
export const BeoIntakeViewContext = createContext<BeoIntakeViewContextValue>(defaultValue);

export function useBeoIntakeView() {
  return useContext(BeoIntakeViewContext);
}

export function BeoIntakeViewProvider({
  value,
  children,
}: {
  value: BeoIntakeViewContextValue;
  children: ReactNode;
}) {
  return (
    <BeoIntakeViewContext.Provider value={value}>
      {children}
    </BeoIntakeViewContext.Provider>
  );
}
