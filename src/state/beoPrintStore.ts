import { create } from "zustand";

export type LeftCheckMode = "spec" | "packout" | "kitchen" | "expeditor" | "server";

type BeoPrintUIState = {
  leftCheck: LeftCheckMode;
  setLeftCheck: (mode: LeftCheckMode) => void;
};

export const useBeoPrintStore = create<BeoPrintUIState>((set) => ({
  leftCheck: "kitchen",
  setLeftCheck: (mode) => set({ leftCheck: mode }),
}));
