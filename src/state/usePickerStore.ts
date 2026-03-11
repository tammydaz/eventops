import { create } from "zustand";

export interface PickerItem {
  id: string;
  name: string;
}

interface PickerState {
  isOpen: boolean;
  pickerType: string | null;
  targetField: string | null;
  pickerTitle: string | null;
  selectedItems: PickerItem[];
  openPicker: (type: string, field: string, title: string) => void;
  closePicker: () => void;
  setSelectedItems: (items: PickerItem[]) => void;
}

export const usePickerStore = create<PickerState>((set) => ({
  isOpen: false,
  pickerType: null,
  targetField: null,
  pickerTitle: null,
  selectedItems: [],

  openPicker: (type, field, title) =>
    set({
      isOpen: true,
      pickerType: type,
      targetField: field,
      pickerTitle: title,
      selectedItems: [],
    }),

  closePicker: () =>
    set({
      isOpen: false,
      pickerType: null,
      targetField: null,
      pickerTitle: null,
      selectedItems: [],
    }),

  setSelectedItems: (items) => set({ selectedItems: items }),
}));
