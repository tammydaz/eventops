import { create } from "zustand";
import {
  loadEvents as fetchEventsList,
  loadEvent as fetchEventById,
  updateEventMultiple,
  deleteEvent as deleteEventApi,
  filterToEditableOnly,
  getBarServiceFieldId,
  FIELD_IDS,
  type EventListItem,
} from "../services/airtable/events";
import { useAuthStore } from "./authStore";
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

  /** Save current event data to Airtable (blur + filter + setFields). Returns true on success. */
  saveCurrentEvent: (eventId: string) => Promise<boolean>;

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
    if (get().selectedEventId === id) return; // already selected — no-op
    // Keep old data visible until new data arrives (prevents 60-component blank flash)
    set({ selectedEventId: id, eventDataLoading: true });
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
    try {
      const result = await fetchEventById(selectedEventId);

      // Race-condition guard: if user switched events while this fetch was in-flight, discard result
      if (get().selectedEventId !== selectedEventId) return;

      if (isErrorResult(result)) {
        console.warn("⚠️ loadEventData: Airtable error (soft fail):", result.message);
        set({ eventDataLoading: false });
        return;
      }
      const fields = result.fields ?? {};
      // Deep-equality guard: only replace selectedEventData if field values actually changed.
      // Prevents re-render cascades when loadEventData is called after optimistic updates.
      const current = get().selectedEventData;
      const hasChanged =
        Object.keys(fields).length !== Object.keys(current).length ||
        Object.keys(fields).some((k) => {
          const a = fields[k];
          const b = current[k];
          if (Array.isArray(a) && Array.isArray(b)) {
            return JSON.stringify(a) !== JSON.stringify(b);
          }
          return a !== b;
        });
      if (hasChanged) {
        set({ eventData: fields, selectedEventData: fields, eventDataLoading: false });
      } else {
        set({ eventDataLoading: false });
      }
    } catch (err) {
      console.error("❌ loadEventData: unexpected error (soft fail):", err);
      set({ eventDataLoading: false });
    }
  },

  updateEvent: async (eventId, patch) => {
    const { selectedEventId, eventData } = get();
    // Dispatch time is read-only except for ops_admin
    const role = useAuthStore.getState().user?.role;
    const patchFiltered =
      role !== "ops_admin" && FIELD_IDS.DISPATCH_TIME in patch
        ? (() => {
            const { [FIELD_IDS.DISPATCH_TIME]: _, ...rest } = patch;
            return rest;
          })()
        : patch;
    const timeFieldIdSet = new Set<string>([
      FIELD_IDS.DISPATCH_TIME,
      FIELD_IDS.FOODWERX_ARRIVAL,
      FIELD_IDS.VENUE_ARRIVAL_TIME,
    ]);
    const hasTimeField = Object.keys(patchFiltered).some((k) => timeFieldIdSet.has(k));
    const needsEventDate = hasTimeField && !patchFiltered[FIELD_IDS.EVENT_DATE] && eventData?.[FIELD_IDS.EVENT_DATE];
    const augmented = needsEventDate
      ? { ...patchFiltered, [FIELD_IDS.EVENT_DATE]: eventData[FIELD_IDS.EVENT_DATE] }
      : patchFiltered;
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

  saveCurrentEvent: async (eventId) => {
    await getBarServiceFieldId();
    (document.activeElement as HTMLElement)?.blur();
    await new Promise((r) => setTimeout(r, 600));
    const { eventData, selectedEventId } = get();
    const raw = selectedEventId === eventId ? eventData : {};
    const dataToSave = filterToEditableOnly(raw);
    if (Object.keys(dataToSave).length === 0) return true;
    const ok = await get().setFields(eventId, { ...dataToSave });
    return ok ?? false;
  },

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
