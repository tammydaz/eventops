import { create } from "zustand";
import {
  loadEvents as fetchEventsList,
  loadEvent as fetchEventById,
  updateEventMultiple,
  deleteEvent as deleteEventApi,
  filterToEditableOnly,
  FIELD_IDS,
  type EventListItem,
} from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

type Fields = Record<string, unknown>;

export type EventStore = {
  events: EventListItem[];
  eventsLoading: boolean;
  eventsError: string | null;
  loadEvents: () => Promise<EventListItem[] | null>;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectEvent: (id: string) => Promise<void>;

  eventData: Fields;
  selectedEventData: Fields;
  eventDataLoading: boolean;
  loadEventData: () => Promise<void>;

  updateEvent: (eventId: string, patch: Fields) => Promise<boolean>;
  setField: (eventId: string, fieldId: string, value: unknown) => Promise<boolean>;
  setFields: (eventId: string, patch: Fields) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;

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
      return null;
    }
    set({ events: result, eventsLoading: false, eventsError: null });
    return result;
  },

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  selectEvent: async (id) => {
    set({ selectedEventId: id, selectedEventData: emptyFields, eventDataLoading: true });
    get().loadEventData();
  },

  eventData: { ...emptyFields },
  selectedEventData: { ...emptyFields },
  eventDataLoading: false,
  loadEventData: async () => {
    const { selectedEventId } = get();
    if (!selectedEventId) {
      set({ eventData: emptyFields, selectedEventData: emptyFields, eventDataLoading: false });
      return;
    }
    set({ eventDataLoading: true });
    const result = await fetchEventById(selectedEventId);
    if (isErrorResult(result)) {
      set({ eventData: emptyFields, selectedEventData: emptyFields, eventDataLoading: false });
      return;
    }
    const fields = result.fields ?? {};
    set({ eventData: fields, selectedEventData: fields, eventDataLoading: false });
  },

  updateEvent: async (eventId, patch) => {
    const { selectedEventId, eventData } = get();
    const timeFieldIdSet = new Set<string>([
      FIELD_IDS.DISPATCH_TIME,
      FIELD_IDS.FOODWERX_ARRIVAL,
      FIELD_IDS.VENUE_ARRIVAL_TIME,
    ]);
    const hasTimeField = Object.keys(patch).some((k) => timeFieldIdSet.has(k));
    const needsEventDate = hasTimeField && !patch[FIELD_IDS.EVENT_DATE] && eventData?.[FIELD_IDS.EVENT_DATE];
    const augmented = needsEventDate
      ? { ...patch, [FIELD_IDS.EVENT_DATE]: eventData[FIELD_IDS.EVENT_DATE] }
      : patch;
    const filtered = filterToEditableOnly(augmented);
    // Optimistic update: merge into store immediately so "Update Event" and other consumers
    // see the latest values even before the API call completes (fixes Bar Service not carrying over)
    if (selectedEventId === eventId && Object.keys(filtered).length > 0) {
      const next = { ...eventData, ...filtered };
      set({ eventData: next, selectedEventData: next });
    }
    const result = await updateEventMultiple(eventId, filtered);
    if (isErrorResult(result)) {
      set({ saveError: result.message ?? "Failed to save" });
      return false;
    }
    set({ saveError: null });
    return true;
  },

  setField: async (eventId, fieldId, value) => {
    return get().updateEvent(eventId, { [fieldId]: value });
  },

  setFields: async (eventId, patch) => {
    return get().updateEvent(eventId, patch);
  },

  deleteEvent: async (eventId) => {
    const result = await deleteEventApi(eventId);
    if (isErrorResult(result)) {
      set({ saveError: result.message ?? "Failed to delete event" });
      return false;
    }
    set({ saveError: null });
    const { selectedEventId, events } = get();
    if (selectedEventId === eventId) {
      set({ selectedEventId: null, selectedEventData: emptyFields, eventData: emptyFields });
    }
    set({ events: events.filter((e) => e.id !== eventId) });
    return true;
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
