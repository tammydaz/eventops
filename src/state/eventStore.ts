import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  createElement,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { loadEvent, loadEvents, updateEventField, updateEventMultiple, type EventListItem } from "../services/airtable/events";
import { isErrorResult } from "../services/airtable/selectors";

export type EventStore = {
  events: EventListItem[];
  eventsLoading: boolean;
  eventsError: string | null;
  selectedEventId: string | null;
  selectedEventData: Record<string, unknown> | null;
  selectedEvent: { id: string; fields: Record<string, unknown> } | null;
  saveError: boolean;
  setSelectedEventId: (eventId: string | null) => void;
  selectEvent: (eventId: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  setField: (recordId: string, fieldId: string, value: unknown) => Promise<void>;
  setFields: (recordId: string, updatesObject: Record<string, unknown>) => Promise<void>;
};

const EventStoreContext = createContext<EventStore | undefined>(undefined);

export const EventStoreProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<Record<string, unknown> | null>(null);
  const [saveError, setSaveError] = useState(false);
  const retryTimer = useRef<number | null>(null);
  const pendingUpdate = useRef<{
    recordId: string;
    updates: Record<string, unknown>;
  } | null>(null);

  const loadEventsList = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    const data = await loadEvents();
    if (isErrorResult(data)) {
      setEventsError(data.message ?? "Unknown error");
      setEventsLoading(false);
      return;
    }
    setEvents(data);
    setEventsLoading(false);
  }, []);

  const loadEventRecord = useCallback(async (eventId: string) => {
    const record = await loadEvent(eventId);
    if (isErrorResult(record)) {
      return;
    }
    setSelectedEventData(record.fields);
  }, []);

  const scheduleRetry = useCallback(() => {
    if (retryTimer.current) return;
    retryTimer.current = window.setTimeout(async () => {
      retryTimer.current = null;
      if (!pendingUpdate.current) return;
      const { recordId, updates } = pendingUpdate.current;
      const retryResult = await updateEventMultiple(recordId, updates);
      if (isErrorResult(retryResult)) {
        scheduleRetry();
        return;
      }
      pendingUpdate.current = null;
      setSaveError(false);
      await loadEventRecord(recordId);
    }, 2000);
  }, [loadEventRecord]);

  const setField = useCallback(async (recordId: string, fieldId: string, value: unknown) => {
    const result = await updateEventField(recordId, fieldId, value);
    if (isErrorResult(result)) {
      setSaveError(true);
      pendingUpdate.current = { recordId, updates: { [fieldId]: value } };
      scheduleRetry();
      return;
    }
    setSaveError(false);
    setSelectedEventData((prev) => ({
      ...(prev ?? {}),
      [fieldId]: value,
    }));
    await loadEventRecord(recordId);
  }, [loadEventRecord, scheduleRetry]);

  const setFields = useCallback(async (recordId: string, updatesObject: Record<string, unknown>) => {
    const result = await updateEventMultiple(recordId, updatesObject);
    if (isErrorResult(result)) {
      setSaveError(true);
      pendingUpdate.current = { recordId, updates: updatesObject };
      scheduleRetry();
      return;
    }
    setSaveError(false);
    setSelectedEventData((prev) => ({
      ...(prev ?? {}),
      ...updatesObject,
    }));
    await loadEventRecord(recordId);
  }, [loadEventRecord, scheduleRetry]);

  const selectEvent = useCallback(async (eventId: string) => {
    setSelectedEventId(eventId);
    await loadEventRecord(eventId);
  }, [loadEventRecord]);

  useEffect(() => {
    loadEventsList();
    const match = window.location.pathname.match(/\/beo-intake\/(.+)$/i);
    if (match?.[1]) {
      const eventId = match[1];
      setSelectedEventId(eventId);
      loadEventRecord(eventId);
    }
    return () => {
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
      }
    };
  }, [loadEventsList, loadEventRecord]);

  const value = useMemo(
    () => ({
      events,
      eventsLoading,
      eventsError,
      selectedEventId,
      selectedEventData,
      selectedEvent: selectedEventId && selectedEventData ? { id: selectedEventId, fields: selectedEventData } : null,
      saveError,
      setSelectedEventId,
      selectEvent,
      loadEvents: loadEventsList,
      loadEvent: loadEventRecord,
      setField,
      setFields,
    }),
    [events, eventsLoading, eventsError, selectedEventId, selectedEventData, saveError]
  );

  return createElement(EventStoreContext.Provider, { value }, children);
};

export const useEventStore = (): EventStore => {
  const context = useContext(EventStoreContext);
  if (!context) {
    throw new Error("EventStoreProvider is missing.");
  }
  return context;
};
