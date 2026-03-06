import { createContext, useContext, useCallback, type ReactNode } from "react";
import type { FeedbackType } from "../../services/feedbackApi";

export interface FeedbackContextValue {
  openSubmitModal: (type?: FeedbackType) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  return ctx ?? { openSubmitModal: () => {} };
}
