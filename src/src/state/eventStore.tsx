import { create } from "zustand";
import {
  loadEvents as fetchEventsList,
  loadEvent as fetchEventById,
  updateEventMultiple,
  type EventListItem,
} from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

type Fields = Record<string, unknown>;

export type EventStore = {
  events: EventListItem[];
  eventsLoading: boolean;
  eventsError: string | null;
  loadEvents: () => Promise<void>;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectEvent: (id: string) => Promise<void>;

  eventData: Fields;
  selectedEventData: Fields;
  loadEventData: () => Promise<void>;

  updateEvent: (eventId: string, patch: Fields) => Promise<void>;
  setField: (eventId: string, fieldId: string, value: unknown) => Promise<void>;
  setFields: (eventId: string, patch: Fields) => Promise<void>;

  saveError: string | null;
  setSaveError: (error: string | null) => void;

  fields: Fields;
  setFieldLegacy: (name: string, value: unknown) => void;
  resetFields: () => void;
  saveEvent: () => Promise<unknown>;
};

const emptyFields: Fields = {};

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  eventsLoading: false,
  eventsError: null,
  loadEvents: async () => {
    set({ eventsLoading: true, eventsError: null });
    const result = await fetchEventsList();
    if (isErrorResult(result)) {
      set({
        eventsLoading: false,
        eventsError: result.message ?? "Failed to load events",
      });
      return;
    }
    set({ events: result, eventsLoading: false, eventsError: null });
  },

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  selectEvent: async (id) => {
    set({ selectedEventId: id });
    await get().loadEventData();
  },

  eventData: { ...emptyFields },
  selectedEventData: { ...emptyFields },
  loadEventData: async () => {
    const { selectedEventId } = get();
    if (!selectedEventId) {
      set({ eventData: emptyFields, selectedEventData: emptyFields });
      return;
    }
    const result = await fetchEventById(selectedEventId);
    if (isErrorResult(result)) {
      set({ eventData: emptyFields, selectedEventData: emptyFields });
      return;
    }
    const fields = result.fields ?? {};
    set({ eventData: fields, selectedEventData: fields });
  },

  updateEvent: async (eventId, patch) => {
    const result = await updateEventMultiple(eventId, patch);
    if (isErrorResult(result)) {
      set({ saveError: result.message ?? "Failed to save" });
      return;
    }
    set({ saveError: null });
    const { selectedEventId, eventData } = get();
    if (selectedEventId === eventId) {
      const next = { ...eventData, ...patch };
      set({ eventData: next, selectedEventData: next });
    }
  },

  setField: async (eventId, fieldId, value) => {
    return get().updateEvent(eventId, { [fieldId]: value });
  },

  setFields: async (eventId, patch) => {
    return get().updateEvent(eventId, patch);
  },

  saveError: null,
  setSaveError: (error) => set({ saveError: error }),

  fields: { ...emptyFields },
  setFieldLegacy: (name, value) =>
    set((state) => ({
      fields: { ...state.fields, [name]: value },
    })),
  resetFields: () => set({ fields: { ...emptyFields } }),
  saveEvent: async () => {
    const res = await fetch("/api/saveEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(get().fields),
    });
    return res.json();
  },
}));
