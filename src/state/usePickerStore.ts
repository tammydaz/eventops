import { create } from "zustand";

export interface PickerItem {
  id: string;
  name: string;
}

const PICKER_CLOSE_GRACE_MS = 2500;

interface PickerState {
  isOpen: boolean;
  pickerType: string | null;
  targetField: string | null;
  pickerTitle: string | null;
  selectedItems: PickerItem[];
  pickerClosedAt: number | null;
  _focusRestore: HTMLElement | null;
  openPicker: (type: string, field: string, title: string) => void;
  closePicker: () => void;
  setSelectedItems: (items: PickerItem[]) => void;
  isWithinCloseGrace: () => boolean;
}

export const usePickerStore = create<PickerState>((set, get) => ({
  isOpen: false,
  pickerType: null,
  targetField: null,
  pickerTitle: null,
  selectedItems: [],
  pickerClosedAt: null,
  _focusRestore: null,

  openPicker: (type, field, title) =>
    set({
      isOpen: true,
      pickerType: type,
      targetField: field,
      pickerTitle: title,
      selectedItems: [],
      pickerClosedAt: null,
      _focusRestore: typeof document !== "undefined" ? document.activeElement as HTMLElement | null : null,
    }),

  closePicker: () => {
    const focusEl = get()._focusRestore;
    set({
      isOpen: false,
      pickerType: null,
      targetField: null,
      pickerTitle: null,
      selectedItems: [],
      pickerClosedAt: Date.now(),
    });
    requestAnimationFrame(() => {
      if (focusEl && typeof focusEl.focus === "function" && document.body.contains(focusEl)) {
        focusEl.focus({ preventScroll: true });
      }
    });
  },

  setSelectedItems: (items) => set({ selectedItems: items }),

  isWithinCloseGrace: () => {
    const closedAt = get().pickerClosedAt;
    return closedAt != null && Date.now() - closedAt < PICKER_CLOSE_GRACE_MS;
  },
}));
