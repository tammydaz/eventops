import { create } from "zustand";
import {
  loadEvents as fetchEventsList,
  loadEvent as fetchEventById,
  updateEventMultiple,
  deleteEvent as deleteEventApi,
  filterToEditableOnly,
  getBarServiceFieldId,
  FIELD_IDS,
  STAFFING_CONFIRMED_FIELD_ID,
  FOH_BEO_FIRED_FIELD_ID,
  FOH_SPECK_COMPLETE_FIELD_ID,
  type EventListItem,
} from "../services/airtable/events";
import { useAuthStore } from "./authStore";
import { isErrorResult, asAirtableCheckbox, asString } from "../services/airtable/selectors";

type Fields = Record<string, unknown>;

export type EventStore = {
  events: EventListItem[];
  eventsLoading: boolean;
  eventsError: string | null;
  loadEvents: (opts?: { background?: boolean }) => Promise<EventListItem[] | null>;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectEvent: (id: string) => Promise<void>;

  eventData: Fields;
  selectedEventData: Fields;
  eventDataLoading: boolean;
  /** Load event by id. Pass id explicitly when switching so we never rely on store timing. */
  loadEventData: (eventId?: string, opts?: { quiet?: boolean }) => Promise<void>;

  updateEvent: (eventId: string, patch: Fields) => Promise<boolean>;
  setField: (eventId: string, fieldId: string, value: unknown) => Promise<boolean>;
  setFields: (eventId: string, patch: Fields) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;

  saveError: string | null;
  setSaveError: (error: string | null) => void;

  /** Save current event data to Airtable (blur + filter + setFields). Returns true on success. */
  saveCurrentEvent: (eventId: string) => Promise<boolean>;

  /** BEO intake: unsaved changes (prompt before leaving page or switching event) */
  intakeDirty: boolean;
  setIntakeDirty: (dirty: boolean) => void;

  fields: Fields;
  setFieldLegacy: (name: string, value: unknown) => void;
  resetFields: () => void;
  saveEvent: () => Promise<unknown>;
};

const emptyFields: Fields = {};

/** Per-record generation: stale GET responses are discarded if a newer load started or completed after a save. */
const eventDataFetchGen = new Map<string, number>();

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  eventsLoading: false,
  eventsError: null,
  loadEvents: async (opts) => {
    const background = opts?.background === true;
    if (!background) {
      set({ eventsLoading: true, eventsError: null });
    }
    const result = await fetchEventsList();
    if (isErrorResult(result)) {
      if (!background) {
        set({
          eventsLoading: false,
          eventsError: result.message ?? "Failed to load events",
        });
      }
      return null;
    }
    set({ events: result, eventsLoading: false, eventsError: null });
    return result;
  },

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  selectEvent: async (id) => {
    // Always update: set id, show loading, clear old data so UI reflects the switch immediately
    set({ selectedEventId: id, eventDataLoading: true, selectedEventData: emptyFields, eventData: emptyFields, intakeDirty: false });
    get().loadEventData(id);
  },

  eventData: { ...emptyFields },
  selectedEventData: { ...emptyFields },
  eventDataLoading: false,
  loadEventData: async (explicitEventId, opts) => {
    const quiet = opts?.quiet === true;
    const eventId = explicitEventId ?? get().selectedEventId;
    if (!eventId) {
      set({ eventData: emptyFields, selectedEventData: emptyFields, eventDataLoading: false });
      return;
    }
    const nextGen = (eventDataFetchGen.get(eventId) ?? 0) + 1;
    eventDataFetchGen.set(eventId, nextGen);
    const myGen = nextGen;
    if (!quiet) set({ eventDataLoading: true });
    try {
      const result = await fetchEventById(eventId);
      if (get().selectedEventId !== eventId) {
        set({ eventDataLoading: false });
        return;
      }
      if (eventDataFetchGen.get(eventId) !== myGen) return;
      if (isErrorResult(result)) {
        console.warn("⚠️ loadEventData: Airtable error (soft fail):", result.message);
        set({ eventDataLoading: false });
        return;
      }
      const fields = result.fields ?? {};
      set({ eventData: fields, selectedEventData: fields, eventDataLoading: false });
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
    const staffKey = STAFFING_CONFIRMED_FIELD_ID;
    if (staffKey && staffKey in patchFiltered && !(staffKey in filtered)) {
      set({
        saveError:
          "Could not save staffing confirmation. The field may not be allowed for this role. Contact support if this persists.",
      });
      return false;
    }
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
    const listPatch: Partial<EventListItem> = {};
    if (staffKey && staffKey in patchFiltered) {
      listPatch.staffingConfirmedInNowsta = asAirtableCheckbox(patchFiltered[staffKey]);
    }
    if (FIELD_IDS.FW_STAFF_SUMMARY in patchFiltered) {
      const v = patchFiltered[FIELD_IDS.FW_STAFF_SUMMARY];
      listPatch.fwStaffSummaryPresent = typeof v === "string" && v.trim().length > 0;
    }
    if (FOH_BEO_FIRED_FIELD_ID && FOH_BEO_FIRED_FIELD_ID in patchFiltered) {
      listPatch.beoFiredToBOH = patchFiltered[FOH_BEO_FIRED_FIELD_ID] === true;
    }
    if (FOH_SPECK_COMPLETE_FIELD_ID && FOH_SPECK_COMPLETE_FIELD_ID in patchFiltered) {
      listPatch.speckComplete = patchFiltered[FOH_SPECK_COMPLETE_FIELD_ID] === true;
    }
    /* Intake blur saves don't call loadEvents(); keep list rows in sync for sidebar + Today's Tasks BEO lines. */
    if (FIELD_IDS.BEO_NOTES in filtered) {
      const s = asString(filtered[FIELD_IDS.BEO_NOTES]);
      listPatch.beoNotes = s.trim() || undefined;
    }
    if (FIELD_IDS.BEO_TIMELINE in filtered) {
      const s = asString(filtered[FIELD_IDS.BEO_TIMELINE]);
      listPatch.timelineRaw = s.trim() || undefined;
    }
    if (FIELD_IDS.VENUE in filtered) {
      const s = asString(filtered[FIELD_IDS.VENUE]);
      listPatch.venue = s.trim() || undefined;
    }
    if (FIELD_IDS.CLIENT_STREET in filtered) {
      const s = asString(filtered[FIELD_IDS.CLIENT_STREET]);
      listPatch.clientStreet = s.trim() || undefined;
    }
    if (FIELD_IDS.CLIENT_CITY in filtered) {
      const s = asString(filtered[FIELD_IDS.CLIENT_CITY]);
      listPatch.clientCity = s.trim() || undefined;
    }
    if (FIELD_IDS.CLIENT_STATE in filtered) {
      const raw = filtered[FIELD_IDS.CLIENT_STATE];
      const s =
        typeof raw === "string"
          ? raw.trim()
          : raw && typeof raw === "object" && "name" in (raw as object)
            ? String((raw as { name?: string }).name ?? "").trim()
            : asString(raw).trim();
      listPatch.clientState = s || undefined;
    }
    if (FIELD_IDS.CLIENT_ZIP in filtered) {
      const s = asString(filtered[FIELD_IDS.CLIENT_ZIP]);
      listPatch.clientZip = s.trim() || undefined;
    }
    if (FIELD_IDS.VENUE_ADDRESS in filtered) {
      const s = asString(filtered[FIELD_IDS.VENUE_ADDRESS]);
      listPatch.venueStreet = s.trim() || undefined;
    }
    if (FIELD_IDS.VENUE_CITY in filtered) {
      const s = asString(filtered[FIELD_IDS.VENUE_CITY]);
      listPatch.venueCity = s.trim() || undefined;
    }
    if (FIELD_IDS.VENUE_STATE in filtered) {
      const raw = filtered[FIELD_IDS.VENUE_STATE];
      const s =
        typeof raw === "string"
          ? raw.trim()
          : raw && typeof raw === "object" && "name" in (raw as object)
            ? String((raw as { name?: string }).name ?? "").trim()
            : asString(raw).trim();
      listPatch.venueState = s || undefined;
    }
    if (FIELD_IDS.VENUE_ZIP in filtered) {
      const s = asString(filtered[FIELD_IDS.VENUE_ZIP]);
      listPatch.venueZip = s.trim() || undefined;
    }
    if (Object.keys(listPatch).length > 0) {
      set((s) => ({
        events: s.events.map((ev) => (ev.id === eventId ? { ...ev, ...listPatch } : ev)),
      }));
    }
    const fohRefresh =
      (FOH_BEO_FIRED_FIELD_ID && FOH_BEO_FIRED_FIELD_ID in patchFiltered) ||
      (FOH_SPECK_COMPLETE_FIELD_ID && FOH_SPECK_COMPLETE_FIELD_ID in patchFiltered);
    if (fohRefresh) {
      void get().loadEvents({ background: true });
    }
    if (staffKey && staffKey in patchFiltered) {
      void get().loadEvents({ background: true });
      if (get().selectedEventId === eventId) {
        await get().loadEventData(eventId, { quiet: true });
      }
    }
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
    if (ok) set({ intakeDirty: false });
    return ok ?? false;
  },

  intakeDirty: false,
  setIntakeDirty: (dirty) => set({ intakeDirty: dirty }),

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
