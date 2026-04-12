import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import { EventSelectorSimple } from "../components/EventSelectorSimple";
import {
  HeaderSection,
  EventCoreSection,
  TimelineSection,
  KitchenAndServicewareSection,
  SiteVisitLogisticsSection,
  FormSection,
} from "../components/beo-intake";
import { CollapsibleSubsection } from "../components/beo-intake/FormSection";
import { BEO_SECTION_PILL_ACCENT } from "../components/beo-intake/FormSection";
import { BeverageServicesSection } from "../components/beo-intake/BeverageServicesSection";
import { ApprovalsLockoutSection } from "../components/beo-intake/ApprovalsLockoutSection";
import { BeoIntakeActionBar } from "../components/beo-intake/BeoIntakeActionBar";
import { BeoJumpToNav, jumpToBeoSection } from "../components/beo-intake/BeoJumpToNav";
import { ConfirmSendToBOHModal } from "../components/ConfirmSendToBOHModal";
import { SubmitChangeRequestModal } from "../components/SubmitChangeRequestModal";
import { MissingFieldsModal } from "../components/MissingFieldsModal";
import { UnsavedChangesModal } from "../components/UnsavedChangesModal";
import { useAuthStore } from "../state/authStore";
import { canEditDispatchTime } from "../lib/auth";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { deliveryFoodListSectionKeys } from "../lib/deliveryShadowSectionLabels";
import { isChangeRequested, allBOHConfirmedChange } from "../lib/productionHelpers";
import { asSingleSelectName, asString, isErrorResult } from "../services/airtable/selectors";
import { FIELD_IDS, getLockoutFieldIds, getBOHProductionFieldIds } from "../services/airtable/events";
import { secondsTo12HourString } from "../utils/timeHelpers";
import { createTask } from "../services/airtable/tasks";
import { TASK_TYPE_OPTION } from "../services/airtable/tasksSchema";
import { MenuPickerModal } from "../components/MenuPickerModal";
import { GlobalSearchPickerModal } from "../components/GlobalSearchPickerModal";
import { usePickerStore } from "../state/usePickerStore";
import {
  DELIVERY_COLD_DISPLAY_TARGET_FIELD,
  DELIVERY_INTAKE_TARGET_FIELD,
  fetchMenuItemNamesByIds,
  updateMenuItemVesselType,
  VESSEL_TYPE_VALUES,
} from "../services/airtable/menuItems";
import {
  createEventMenuRow,
  targetFieldToSection,
  loadEventMenuRows,
  deleteEventMenuRow,
  updateEventMenuRow,
  syncShadowToEvent,
  type EventMenuRow,
  type EventMenuRowComponent,
  type ChildOverridesData,
} from "../services/airtable/eventMenu";
import { fetchMenuItemChildren, fetchMenuItemsByCategory } from "../services/airtable/menuItems";
import { CreationStationContent, MenuSection } from "../components/beo-intake/MenuSection";
import { DeliveryIntakeMenuAddRow } from "../components/beo-intake/DeliveryIntakeMenuAddRow";
import { DeliveryPackageConfigModal } from "../components/beo-intake/DeliveryPackageConfigModal";
import { DeliveryPackagesPanel } from "../components/beo-intake/DeliveryPackagesPanel";
import { getDeliveryPackagePreset, type DeliveryPackagePreset } from "../config/deliveryPackagePresets";
import { fetchMenuItemByExactName } from "../services/airtable/menuItems";
import { BoxedLunchSection } from "../components/beo-intake/BoxedLunchSection";
import { SandwichPlatterConfigModal } from "../components/beo-intake/SandwichPlatterConfigModal";
import {
  getPlatterOrdersByEventId,
  platterOrdersHaveContent,
  setPlatterOrdersForEvent,
} from "../state/platterOrdersStore";
import { boxedLunchOrdersHaveContent, loadBoxedLunchOrdersByEventId } from "../services/airtable/boxedLunchOrders";
import { DeliveryPaperProductsSection } from "../components/beo-intake/DeliveryPaperProductsSection";
import { BeoLivePreview } from "../components/BeoLivePreview";
import { calculateAutoSpec, type FoodCategory } from "../utils/beoAutoSpec";
import { getBeoSpecStorageKey, getSpecOverrideKey, getShadowMenuStorageKey } from "../utils/beoSpecStorage";
import "./IntakePage.css";

const SECTION_TO_FIELD_ID: Record<string, string> = {
  "Passed Appetizers": FIELD_IDS.PASSED_APPETIZERS,
  "Presented Appetizers": FIELD_IDS.PRESENTED_APPETIZERS,
  "Buffet – Metal": FIELD_IDS.BUFFET_METAL,
  "Buffet – China": FIELD_IDS.BUFFET_CHINA,
  Desserts: FIELD_IDS.DESSERTS,
  Deli: FIELD_IDS.FULL_SERVICE_DELI,
  "Room Temp": FIELD_IDS.ROOM_TEMP_DISPLAY,
  "Room Temp / Display": FIELD_IDS.ROOM_TEMP_DISPLAY,
};
function getFieldIdForSection(section: string, isDelivery: boolean): string {
  if (section === "Deli") return isDelivery ? FIELD_IDS.DELIVERY_DELI : FIELD_IDS.FULL_SERVICE_DELI;
  return SECTION_TO_FIELD_ID[section] ?? FIELD_IDS.FULL_SERVICE_DELI;
}
const SECTION_TO_CATEGORY: Record<string, FoodCategory> = {
  "Passed Appetizers": "passed",
  "Presented Appetizers": "presented",
  "Buffet – Metal": "buffet",
  "Buffet – China": "buffet",
  Desserts: "dessert",
  Deli: "buffet",
  "Room Temp": "buffet",
  "Room Temp / Display": "buffet",
};

/** Required BEO fields for Send to BOH. Empty or falsy = missing. */
const REQUIRED_BEO_FIELDS: { fieldId: string; label: string }[] = [
  { fieldId: FIELD_IDS.EVENT_DATE, label: "Event Date" },
  { fieldId: FIELD_IDS.GUEST_COUNT, label: "Guest Count" },
  { fieldId: FIELD_IDS.VENUE, label: "Venue" },
  { fieldId: FIELD_IDS.CLIENT_FIRST_NAME, label: "Client First Name" },
  { fieldId: FIELD_IDS.CLIENT_LAST_NAME, label: "Client Last Name" },
  { fieldId: FIELD_IDS.PRIMARY_CONTACT_NAME, label: "Primary Contact Name" },
  { fieldId: FIELD_IDS.EVENT_TYPE, label: "Event Type" },
];

function getMissingRequiredFields(data: Record<string, unknown> | undefined): { fieldId: string; label: string }[] {
  if (!data) return REQUIRED_BEO_FIELDS;
  return REQUIRED_BEO_FIELDS.filter(({ fieldId }) => {
    const v = data[fieldId];
    if (v === undefined || v === null) return true;
    if (typeof v === "string") return !v.trim();
    if (typeof v === "number") return isNaN(v) || v <= 0;
    return true;
  });
}

/** URL ?section= param → BeoJumpToNav section id */
const SECTION_PARAM_TO_ID: Record<string, string> = {
  header: "beo-section-header",
  client: "beo-section-header",
  event: "beo-section-header",
  venue: "beo-section-header",
  menu: "beo-section-menu",
  bar: "beo-section-bar",
  serviceware: "beo-section-serviceware",
  timeline: "beo-section-timeline",
  notes: "beo-section-notes",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: copied ? "rgba(13,148,136,0.3)" : "rgba(255,255,255,0.08)", color: copied ? "#5eead4" : "#e2e8f0", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
    >
      {copied ? "✓ Copied!" : label}
    </button>
  );
}

export const BeoIntakePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId, setFields, loadEventData, eventDataLoading, selectedEventData, intakeDirty, setIntakeDirty, saveCurrentEvent, events } = useEventStore();
  const [lockoutIds, setLockoutIds] = useState<Awaited<ReturnType<typeof getLockoutFieldIds>>>(null);
  const [bohIds, setBohIds] = useState<Awaited<ReturnType<typeof getBOHProductionFieldIds>>>(null);
  const [showSendToBOHModal, setShowSendToBOHModal] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [showPackagesPanel, setShowPackagesPanel] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [pendingPackageItem, setPendingPackageItem] = useState<{ id: string; name: string; routeTargetField: string; preset: DeliveryPackagePreset } | null>(null);
  const [dressingPickerSalad, setDressingPickerSalad] = useState<{ id: string; name: string; shadowRowId: string } | null>(null);
  const [dressingPickerItems, setDressingPickerItems] = useState<{ id: string; name: string }[]>([]);
  const [dressingPickerSearch, setDressingPickerSearch] = useState("");
  const [pendingDressingIds, setPendingDressingIds] = useState<string[]>([]);
  const [shadowMenuRows, setShadowMenuRows] = useState<(EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] })[]>([]);
  /** Skip next sessionStorage write for shadow menu — avoids persisting previous event's rows under the new event id (passive effect can run before rows clear). */
  const shadowMenuStorageSkipRef = useRef(false);
  const shadowMenuLoadGenRef = useRef(0);
  const [editingShadowRow, setEditingShadowRow] = useState<(EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] }) | null>(null);
  const [editDraft, setEditDraft] = useState<{ customText: string; packOutNotes: string }>({ customText: "", packOutNotes: "" });
  const [editDisplayNameEditing, setEditDisplayNameEditing] = useState(false);
  const [editDefaultChildren, setEditDefaultChildren] = useState<{ id: string; name: string }[]>([]);
  const [editChildOverrides, setEditChildOverrides] = useState<ChildOverridesData>({ overrides: {}, added: [] });
  const [editAddNewItem, setEditAddNewItem] = useState("");
  const [menuSpecOverrides, setMenuSpecOverrides] = useState<Record<string, string>>({});
  const [childSpecOverrides, setChildSpecOverrides] = useState<Record<string, string>>({});
  /** Shadow menu sections default expanded; `section === false` means user collapsed that header. */
  const [shadowMenuSectionExpanded, setShadowMenuSectionExpanded] = useState<Record<string, boolean>>({});
  const [deliveryBoxedSectionOpen, setDeliveryBoxedSectionOpen] = useState(false);
  const [deliveryPlatterSectionOpen, setDeliveryPlatterSectionOpen] = useState(false);
  /** After Airtable boxed load for this event (avoid showing kitchen chrome until we know if boxed exists). */
  const [deliveryBoxedHydrated, setDeliveryBoxedHydrated] = useState(false);
  const [deliveryHasSavedBoxedOrders, setDeliveryHasSavedBoxedOrders] = useState(false);
  /** User opened + Boxed / + Sandwich platters — show menu body even before save. */
  const [deliveryRevealFoodChrome, setDeliveryRevealFoodChrome] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const { user } = useAuthStore();

  const showUnsavedModal = pendingEventId !== null;

  useEffect(() => {
    if (!intakeDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [intakeDirty]);

  const eventType = selectedEventData ? asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE]) : "";
  const isDelivery = isDeliveryOrPickup(eventType);

  useEffect(() => {
    if (!selectedEventId || !isDelivery) {
      setDeliveryBoxedHydrated(false);
      setDeliveryHasSavedBoxedOrders(false);
      return;
    }
    setDeliveryBoxedHydrated(false);
    setDeliveryBoxedSectionOpen(false);
    let cancel = false;
    void (async () => {
      const res = await loadBoxedLunchOrdersByEventId(selectedEventId);
      if (cancel) return;
      setDeliveryBoxedHydrated(true);
      const has = !isErrorResult(res) && boxedLunchOrdersHaveContent(res);
      setDeliveryHasSavedBoxedOrders(has);
      if (has) setDeliveryBoxedSectionOpen(true);
    })();
    return () => {
      cancel = true;
    };
  }, [selectedEventId, isDelivery]);

  useEffect(() => {
    if (!selectedEventId || !isDelivery) return;
    setDeliveryPlatterSectionOpen(platterOrdersHaveContent(selectedEventId));
  }, [selectedEventId, isDelivery]);

  useEffect(() => {
    setDeliveryRevealFoodChrome(false);
  }, [selectedEventId]);

  /** Delivery: only pills until shadow has rows, corporate data exists, or user taps + Boxed / + Platters. */
  const deliveryMenuBodyVisible =
    !isDelivery ||
    (Boolean(selectedEventId) &&
      (shadowMenuRows.length > 0 ||
        platterOrdersHaveContent(selectedEventId) ||
        (deliveryBoxedHydrated && deliveryHasSavedBoxedOrders) ||
        deliveryRevealFoodChrome));

  const eventDateRaw = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_DATE]) : "";
  const eventDateNorm = (eventDateRaw || "").trim();
  const sameDayEvents = events.filter((e) => (e.eventDate || "").trim() === eventDateNorm);
  const sortedByDispatch = [...sameDayEvents].sort((a, b) => (a.dispatchTimeSeconds ?? 999999) - (b.dispatchTimeSeconds ?? 999999));
  const jobIndex = selectedEventId ? sortedByDispatch.findIndex((e) => e.id === selectedEventId) + 1 : 0;
  const jobNumberDisplay = jobIndex > 0 ? String(jobIndex).padStart(3, "0") : "—";
  const dispatchTimeDisplay = selectedEventData ? secondsTo12HourString(selectedEventData[FIELD_IDS.DISPATCH_TIME]) : "—";
  const canEditDispatch = canEditDispatchTime(user?.role ?? null);

  const selectEventRef = useRef(selectEvent);
  selectEventRef.current = selectEvent;
  const loadEventDataRef = useRef(loadEventData);
  loadEventDataRef.current = loadEventData;
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/beo-intake/")) {
      const id = pathname.split("/beo-intake/")[1]?.split("/")[0]?.trim();
      if (id) selectEventRef.current(id).catch(() => null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEventId) loadEventDataRef.current();
  }, [selectedEventId]);

  useEffect(() => {
    const param = searchParams.get("section");
    let sectionId = param ? SECTION_PARAM_TO_ID[param] : null;
    if (sectionId === "beo-section-serviceware" && isDelivery) {
      sectionId = "beo-section-delivery-paper";
    }
    if (!sectionId || !selectedEventId || eventDataLoading) return;
    const t = setTimeout(() => jumpToBeoSection(sectionId), 500);
    return () => clearTimeout(t);
  }, [selectedEventId, eventDataLoading, searchParams, isDelivery]);

  const setSelectedEventIdRef = useRef(setSelectedEventId);
  setSelectedEventIdRef.current = setSelectedEventId;
  useEffect(() => {
    const onPopState = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/beo-intake/")) {
        const id = pathname.split("/beo-intake/")[1]?.split("/")[0]?.trim();
        if (id) selectEventRef.current(id).catch(() => null);
      } else {
        setSelectedEventIdRef.current(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    getLockoutFieldIds().then(setLockoutIds);
  }, []);

  useEffect(() => {
    getBOHProductionFieldIds().then(setBohIds);
  }, []);

  const loadShadowMenu = useCallback(
    async (options?: { retryIfEmpty?: boolean }) => {
      if (!selectedEventId) {
        setShadowMenuRows([]);
        setMenuSpecOverrides({});
        setChildSpecOverrides({});
        return;
      }
      const eventIdForThisLoad = selectedEventId;
      // Increment generation so any older in-flight load for this same event is discarded
      const myGen = ++shadowMenuLoadGenRef.current;
      const loadStale = () =>
        useEventStore.getState().selectedEventId !== eventIdForThisLoad ||
        shadowMenuLoadGenRef.current !== myGen;

      const fetchWithRetry = async (attempt = 0): Promise<EventMenuRow[] | { error: true }> => {
        const res = await loadEventMenuRows(eventIdForThisLoad);
        if (!res || "error" in res) return res ?? { error: true };
        if (res.length === 0 && options?.retryIfEmpty && attempt < 2) {
          await new Promise((r) => setTimeout(r, 200));
          return fetchWithRetry(attempt + 1);
        }
        return res;
      };
      const res = await fetchWithRetry();
      if (loadStale()) return;
      if (!res || "error" in res) {
        console.error("[Event Menu] loadShadowMenu failed", res);
        if (!options?.retryIfEmpty) {
          try {
            const stored = sessionStorage.getItem(getShadowMenuStorageKey(eventIdForThisLoad));
            if (stored) {
              const parsed = JSON.parse(stored) as (EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] })[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                if (!loadStale()) setShadowMenuRows(parsed);
                return;
              }
            }
          } catch {
            /* ignore */
          }
          if (!loadStale()) setShadowMenuRows([]);
        }
        return;
      }
      if (res.length === 0) {
        try {
          const stored = sessionStorage.getItem(getShadowMenuStorageKey(eventIdForThisLoad));
          if (stored) {
            const parsed = JSON.parse(stored) as (EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] })[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (!loadStale()) setShadowMenuRows(parsed);
              return;
            }
          }
        } catch {
          /* ignore */
        }
        if (!loadStale()) setShadowMenuRows([]);
        return;
      }
      const catalogIds = res.map((r) => r.catalogItemId).filter((id): id is string => id != null);
      const names = catalogIds.length ? await fetchMenuItemNamesByIds(catalogIds) : {};
      if (loadStale()) return;
      const uniqueCatalogIds = [...new Set(catalogIds)];
      const childrenMap: Record<string, { id: string; name: string }[]> = {};
      await Promise.all(
        uniqueCatalogIds.map(async (id) => {
          try {
            const children = await fetchMenuItemChildren(id);
            const arr = Array.isArray(children) ? children : [];
            console.log("[loadShadowMenu] fetchMenuItemChildren", { catalogId: id, childCount: arr.length, children: arr.map(c => c.name) });
            childrenMap[id] = arr;
          } catch (err) {
            console.warn("[loadShadowMenu] fetchMenuItemChildren failed for", id, err);
            childrenMap[id] = [];
          }
        })
      );
      if (loadStale()) return;
      const rowsWithComponents = res.map((r) => {
        const defaultChildren = (r.catalogItemId && childrenMap[r.catalogItemId]) || [];
        const co = r.childOverrides;
        const overrides = co?.overrides ?? {};
        const added = co?.added ?? [];
        const components: EventMenuRowComponent[] = [
          ...defaultChildren
            .filter((dc) => (overrides[dc.id]?.enabled ?? true) !== false)
            .map((dc) => ({
              name: overrides[dc.id]?.label ?? dc.name,
              isRemoved: false,
              isAdded: false,
            })),
          ...added.map((label) => ({ name: label || "—", isRemoved: false, isAdded: true })),
        ];
        console.log("[ChildOverrides] Merged children", { rowId: r.id, catalogItemId: r.catalogItemId, defaultCount: defaultChildren.length, addedCount: added.length, mergedCount: components.length });
        return {
          ...r,
          catalogItemName: (r.catalogItemId && names[r.catalogItemId]) || r.displayName || r.catalogItemId || "—",
          components,
        };
      });
      if (!loadStale()) setShadowMenuRows(rowsWithComponents);
    },
    [selectedEventId]
  );

  /** Clear menu UI before paint so you never see the previous event's food under the new header. */
  useLayoutEffect(() => {
    shadowMenuLoadGenRef.current = 0; // reset generation on event switch
    if (!selectedEventId) {
      shadowMenuStorageSkipRef.current = true;
      setShadowMenuRows([]);
      setEditingShadowRow(null);
      setShadowMenuSectionExpanded({});
      return;
    }
    shadowMenuStorageSkipRef.current = true;
    setShadowMenuRows([]);
    setEditingShadowRow(null);
    setShadowMenuSectionExpanded({});
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    void loadShadowMenu();
  }, [selectedEventId, loadShadowMenu]);

  useEffect(() => {
    if (!selectedEventId) return;
    try {
      const raw = localStorage.getItem(getBeoSpecStorageKey(selectedEventId));
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        if (parsed && typeof parsed === "object") setMenuSpecOverrides(parsed);
      } else {
        setMenuSpecOverrides({});
      }
    } catch {
      setMenuSpecOverrides({});
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || Object.keys(menuSpecOverrides).length === 0) return;
    try {
      localStorage.setItem(getBeoSpecStorageKey(selectedEventId), JSON.stringify(menuSpecOverrides));
    } catch {
      /* ignore */
    }
  }, [selectedEventId, menuSpecOverrides]);

  /** Persist by shadowMenuRows only — do NOT depend on selectedEventId (that caused event A's rows to save under B's key mid-switch). */
  useEffect(() => {
    if (shadowMenuStorageSkipRef.current) {
      shadowMenuStorageSkipRef.current = false;
      return;
    }
    const sid = useEventStore.getState().selectedEventId;
    if (!sid) return;
    try {
      if (shadowMenuRows.length === 0) {
        // Clear the cache so loadShadowMenu doesn't restore deleted items from stale storage
        sessionStorage.removeItem(getShadowMenuStorageKey(sid));
      } else {
        sessionStorage.setItem(getShadowMenuStorageKey(sid), JSON.stringify(shadowMenuRows));
      }
    } catch {
      /* ignore */
    }
  }, [shadowMenuRows]);

  const beoSentToBOH = bohIds?.beoSentToBOH && selectedEventData ? selectedEventData[bohIds.beoSentToBOH] === true : false;
  const isLocked =
    selectedEventId &&
    selectedEventData &&
    (beoSentToBOH ||
      (lockoutIds &&
        selectedEventData[lockoutIds.guestCountConfirmed] === true &&
        selectedEventData[lockoutIds.menuAcceptedByKitchen] === true));

  const handleSpecOverrideChange = useCallback((specKey: string, value: string) => {
    setIntakeDirty(true);
    setMenuSpecOverrides((prev) => ({ ...prev, [specKey]: value }));
  }, [setIntakeDirty]);

  const handleSauceChange = useCallback(
    async (rowId: string, value: string, customSauce?: string) => {
      if (isLocked) return;
      setIntakeDirty(true);
      const sauceVal = value === "Other" ? (customSauce?.trim() || null) : value === "Default" ? null : value;
      await updateEventMenuRow(rowId, { sauceOverride: sauceVal });
      await loadShadowMenu();
    },
    [isLocked, loadShadowMenu]
  );

  useEffect(() => {
    if (!editingShadowRow?.catalogItemId) {
      setEditDefaultChildren([]);
      setEditChildOverrides({ overrides: {}, added: [] });
      setEditAddNewItem("");
      return;
    }
    let cancelled = false;
    (async () => {
      const children = await fetchMenuItemChildren(editingShadowRow!.catalogItemId!);
      if (cancelled) return;
      const childrenList = Array.isArray(children) ? children : [];
      const co = editingShadowRow!.childOverrides;
      const overrides = co?.overrides ?? {};
      const added = co?.added ?? [];
      setEditDefaultChildren(childrenList);
      setEditChildOverrides({ overrides: { ...overrides }, added: [...added] });
      setEditAddNewItem("");
    })();
    return () => { cancelled = true; };
  }, [editingShadowRow?.id, editingShadowRow?.catalogItemId, editingShadowRow?.childOverrides]);

  const eventName = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_NAME]) || "This event" : "This event";
  const clientEmail = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_EMAIL]) : "";
  const clientFirstName = selectedEventData ? asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]) : "";
  const eventDateDisplay = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_DATE]).slice(0, 10) : "";

  const getQuestionnaireLink = () =>
    selectedEventId ? `${window.location.origin}/client-form/${selectedEventId}` : "";

  const getQuestionnaireEmailBody = () => {
    const link = getQuestionnaireLink();
    const greeting = clientFirstName ? `Hi ${clientFirstName},` : "Hi,";
    const dateStr = eventDateDisplay ? ` on ${eventDateDisplay}` : "";
    return `${greeting}\n\nWe're looking forward to your event${dateStr} and want to make sure everything is perfect.\n\nCould you take a few minutes to fill out this short questionnaire? It covers details like venue access, dietary needs, and setup preferences:\n\n${link}\n\nThank you!\n— The Foodwerx Team`;
  };

  const role = user?.role ?? null;
  const canSubmitChangeRequest = role === "foh" || role === "intake" || role === "ops_admin";

  const handleSubmitChangeRequest = useCallback(
    async (_changeNotes: string) => {
      if (!selectedEventId || !lockoutIds) return;
      const updates: Record<string, unknown> = {
        [lockoutIds.guestCountConfirmed]: false,
        [lockoutIds.menuAcceptedByKitchen]: false,
        [lockoutIds.menuChangeRequested]: true,
      };
      if (lockoutIds.productionAccepted) updates[lockoutIds.productionAccepted] = false;
      if (lockoutIds.productionAcceptedFlair) updates[lockoutIds.productionAcceptedFlair] = false;
      if (lockoutIds.productionAcceptedDelivery) updates[lockoutIds.productionAcceptedDelivery] = false;
      if (lockoutIds.productionAcceptedOpsChief) updates[lockoutIds.productionAcceptedOpsChief] = false;
      await setFields(selectedEventId, updates);
      loadEventData();
      setShowChangeRequestModal(false);
    },
    [selectedEventId, lockoutIds, setFields, loadEventData]
  );

  const handleSendToBOH = useCallback(
    async (_initials: string) => {
      if (!selectedEventId) return;
      const patch: Record<string, unknown> = {};
      if (bohIds?.beoSentToBOH) {
        patch[bohIds.beoSentToBOH] = true;
        if (bohIds.eventChangeRequested) patch[bohIds.eventChangeRequested] = false;
        if (bohIds.changeConfirmedByBOH) patch[bohIds.changeConfirmedByBOH] = false;
      }
      if (lockoutIds) {
        if (lockoutIds.productionAccepted) patch[lockoutIds.productionAccepted] = false;
        if (lockoutIds.productionAcceptedFlair) patch[lockoutIds.productionAcceptedFlair] = false;
        if (lockoutIds.productionAcceptedDelivery) patch[lockoutIds.productionAcceptedDelivery] = false;
        if (lockoutIds.productionAcceptedOpsChief) patch[lockoutIds.productionAcceptedOpsChief] = false;
      }
      if (!bohIds?.beoSentToBOH && lockoutIds) {
        patch[lockoutIds.guestCountConfirmed] = true;
        patch[lockoutIds.menuAcceptedByKitchen] = true;
      }
      if (Object.keys(patch).length > 0) {
        await setFields(selectedEventId, patch);
        await loadEvents();
        loadEventData();
      }
      setShowSendToBOHModal(false);
    },
    [selectedEventId, lockoutIds, bohIds, setFields, loadEventData, loadEvents]
  );

  const handleFormInteraction = useCallback(() => {
    if (isLocked && canSubmitChangeRequest) setShowChangeRequestModal(true);
  }, [isLocked, canSubmitChangeRequest]);

  const handleClickSendToBOH = useCallback(() => {
    const missing = getMissingRequiredFields(selectedEventData);
    if (missing.length > 0) setShowMissingFieldsModal(true);
    else setShowSendToBOHModal(true);
  }, [selectedEventData]);

  const handleMissingFieldsConfirm = useCallback(
    async (dueDate: string) => {
      if (!selectedEventId) return;
      const missing = getMissingRequiredFields(selectedEventData);
      for (const { label } of missing) {
        await createTask({
          eventId: selectedEventId,
          taskName: `Get ${label} from client`,
          taskType: TASK_TYPE_OPTION.missingBeoField,
          dueDate,
          status: "Pending",
        });
      }
      setShowMissingFieldsModal(false);
    },
    [selectedEventId, selectedEventData]
  );

  const handlePickerAdd = useCallback(
    async (item: { id: string; name: string; routeTargetField?: string; hasChildren?: boolean }) => {
      const storeTarget = usePickerStore.getState().targetField;
      const targetField =
        storeTarget === DELIVERY_COLD_DISPLAY_TARGET_FIELD || storeTarget === DELIVERY_INTAKE_TARGET_FIELD
          ? item.routeTargetField ?? null
          : item.routeTargetField ?? storeTarget;
      console.log("[handlePickerAdd]", { itemId: item.id, name: item.name, storeTarget, routeTargetField: item.routeTargetField, resolvedTargetField: targetField });
      if (!selectedEventId || !targetField) {
        console.warn("[handlePickerAdd] Skipped: no selectedEventId or targetField", { selectedEventId, targetField });
        return;
      }
      const mappedSection = targetFieldToSection(targetField);
      if (!mappedSection) {
        console.warn("[handlePickerAdd] Skipped: targetFieldToSection returned null for", targetField);
        return;
      }

      // Prevent duplicate shadow rows
      const alreadyExists = shadowMenuRows.some(
        (r) => r.catalogItemId === item.id || (r.catalogItemName ?? "").toLowerCase() === item.name.toLowerCase()
      );
      if (alreadyExists) {
        console.log("[handlePickerAdd] Item already in shadow menu, skipping create", { itemId: item.id, name: item.name });
        return;
      }

      // Check if this item is a choice package — show selection modal before creating shadow row.
      // Works for both delivery (DELIVERY_INTAKE_TARGET_FIELD) and full-service pickers.
      const preset = getDeliveryPackagePreset(item.name);
      if (preset) {
        setPendingPackageItem({ id: item.id, name: item.name, routeTargetField: targetField, preset });
        return;
      }

      const createResult = await createEventMenuRow(selectedEventId, mappedSection, item.id);
      if (createResult && "error" in createResult) {
        console.error("[handlePickerAdd] createEventMenuRow failed:", createResult);
        return;
      }

      const newRowId = (createResult as { id: string }).id;
      const newRow: EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] } = {
        id: newRowId,
        section: mappedSection,
        sortOrder: 0,
        catalogItemId: item.id,
        displayName: null,
        customText: null,
        sauceOverride: null,
        packOutNotes: null,
        parentItemId: null,
        childOverrides: null,
        catalogItemName: item.name,
        components: [],
      };
      setShadowMenuRows((prev) => [...prev, newRow]);

      await syncShadowToEvent(selectedEventId, {
        injectedRows: [{ section: mappedSection, catalogItemId: item.id }],
      });
      await loadShadowMenu({ retryIfEmpty: true });
      await loadEventData(selectedEventId);

      // Auto-open dressing picker when a salad is added to Buffet China
      if (mappedSection === "Buffet \u2013 China" && /\bsalad\b/i.test(item.name)) {
        void fetchMenuItemsByCategory("dressing").then((items) => {
          setDressingPickerItems(items.map((it) => ({ id: it.id, name: it.name })));
        });
        setDressingPickerSalad({ id: item.id, name: item.name, shadowRowId: newRowId });
        setPendingDressingIds([]);
        setDressingPickerSearch("");
      }

      // Edit modal is opened manually via the Edit button on each item

      const vesselTypeMap: Record<string, string> = {
        buffetMetal: VESSEL_TYPE_VALUES.METAL_HOT,
        buffetChina: VESSEL_TYPE_VALUES.CHINA_COLD,
      };
      const vesselType = vesselTypeMap[targetField];
      if (vesselType && item.id.startsWith("rec")) {
        updateMenuItemVesselType(item.id, vesselType).catch((err) =>
          console.warn("⚠️ Vessel type save failed (non-blocking):", err)
        );
      }
    },
    [selectedEventId, loadShadowMenu, loadEventData]
  );

  /** Called when staff completes the DeliveryPackageConfigModal. Creates the shadow row then saves picks as customText. */
  const handlePackageConfirm = useCallback(
    async (customLines: string[]) => {
      if (!pendingPackageItem || !selectedEventId) { setPendingPackageItem(null); return; }
      const { id, name, routeTargetField, preset } = pendingPackageItem;
      setPendingPackageItem(null);
      const mappedSection = targetFieldToSection(routeTargetField);
      if (!mappedSection) return;
      const createResult = await createEventMenuRow(selectedEventId, mappedSection, id);
      if (createResult && "error" in createResult) {
        console.error("[handlePackageConfirm] createEventMenuRow failed:", createResult);
        return;
      }
      const newRowId = (createResult as { id: string }).id;
      const customText = customLines.join("\n");
      if (customText) await updateEventMenuRow(newRowId, { customText });
      const newRow: EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] } = {
        id: newRowId,
        section: mappedSection,
        sortOrder: 0,
        catalogItemId: id,
        displayName: null,
        customText: customText || null,
        sauceOverride: null,
        packOutNotes: null,
        parentItemId: null,
        childOverrides: null,
        catalogItemName: name,
        components: [],
      };
      setShadowMenuRows((prev) => [...prev, newRow]);
      await syncShadowToEvent(selectedEventId, { injectedRows: [{ section: mappedSection, catalogItemId: id }] });
      await loadShadowMenu({ retryIfEmpty: true });
      await loadEventData(selectedEventId);
    },
    [pendingPackageItem, selectedEventId, loadShadowMenu, loadEventData]
  );

  /** Called when staff clicks a package in the DeliveryPackagesPanel. Looks up the Airtable ID then opens the config modal. */
  const handlePanelSelectPackage = useCallback(async (preset: DeliveryPackagePreset) => {
    const found = await fetchMenuItemByExactName(preset.displayName);
    if (!found) {
      alert(`Could not find "${preset.displayName}" in the menu catalog. Please check Airtable.`);
      return;
    }
    setPendingPackageItem({ id: found.id, name: found.name, routeTargetField: preset.routeTargetField, preset });
  }, []);

  const handlePickerRemove = useCallback(
    async (catalogItemId: string, itemName?: string) => {
      if (!selectedEventId) return;
      let row = shadowMenuRows.find((r) => r.catalogItemId === catalogItemId);
      if (!row && itemName) {
        const nameLower = itemName.toLowerCase();
        row = shadowMenuRows.find(
          (r) => (r.catalogItemName ?? "").toLowerCase() === nameLower ||
                 (r.customText ?? "").toLowerCase() === nameLower ||
                 (r.displayName ?? "").toLowerCase() === nameLower
        );
      }
      if (!row) {
        console.warn("[handlePickerRemove] No matching row found for", { catalogItemId, itemName, rowCount: shadowMenuRows.length });
        return;
      }
      console.log("[handlePickerRemove] Deleting row", { rowId: row.id, catalogItemId: row.catalogItemId, name: row.catalogItemName });
      setShadowMenuRows((prev) => prev.filter((r) => r.id !== row!.id));
      await deleteEventMenuRow(row.id);
      await syncShadowToEvent(selectedEventId);
      await loadShadowMenu();
    },
    [selectedEventId, shadowMenuRows, loadShadowMenu]
  );

  const targetField = usePickerStore((s) => s.targetField);
  const pickerTypeOpen = usePickerStore((s) => s.pickerType);
  const openPicker = usePickerStore((s) => s.openPicker);
  const pickerAlreadyAddedIds = useMemo(() => {
    if (!targetField) return [];
    if (targetField === DELIVERY_INTAKE_TARGET_FIELD) {
      const ids: string[] = [];
      for (const r of shadowMenuRows) {
        if (r.catalogItemId) ids.push(r.catalogItemId);
      }
      return ids;
    }
    const hotSections = new Set(["Passed Appetizers", "Presented Appetizers", "Buffet – Metal"]);
    const coldSections = new Set(["Buffet – China", "Room Temp", "Room Temp / Display", "Desserts"]);
    if (pickerTypeOpen === "delivery_chafer_hot" || pickerTypeOpen === "delivery_chafer_ready") {
      return shadowMenuRows
        .filter((r) => r.catalogItemId && hotSections.has(r.section))
        .map((r) => r.catalogItemId as string);
    }
    if (targetField === DELIVERY_COLD_DISPLAY_TARGET_FIELD) {
      return shadowMenuRows
        .filter((r) => r.catalogItemId && coldSections.has(r.section))
        .map((r) => r.catalogItemId as string);
    }
    if (pickerTypeOpen === "delivery_bulk_sides") {
      return shadowMenuRows
        .filter(
          (r) =>
            r.catalogItemId &&
            (r.section === "Buffet – China" || r.section === "Room Temp" || r.section === "Room Temp / Display")
        )
        .map((r) => r.catalogItemId as string);
    }
    const section = targetFieldToSection(targetField);
    if (!section) return [];
    return shadowMenuRows
      .filter((r) => r.section === section && r.catalogItemId)
      .map((r) => r.catalogItemId as string);
  }, [targetField, pickerTypeOpen, shadowMenuRows]);

  const pickerAlreadyAddedNames = useMemo(() => {
    if (targetField !== DELIVERY_INTAKE_TARGET_FIELD) return undefined;
    return shadowMenuRows
      .filter((r) => r.catalogItemName)
      .map((r) => r.catalogItemName as string);
  }, [targetField, shadowMenuRows]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (usePickerStore.getState().isOpen) return;
      if (usePickerStore.getState().isWithinCloseGrace()) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(".picker-modal-backdrop") ||
        target.closest(".picker-modal") ||
        target.closest(".picker-done-button") ||
        target.closest(".station-config-modal") ||
        target.closest(".station-picker-modal") ||
        target.closest("[role='dialog']") ||
        target.closest(".beo-edit-modal-backdrop") ||
        target.closest(".beo-edit-modal") ||
        target.closest("[data-beo-portal-modal]")
      )
        return;
      if (!target.closest(".beo-pill")) {
        window.dispatchEvent(new CustomEvent("beo-collapse-all-pills"));
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  const accentColor = isDelivery ? "#22c55e" : "#ff6b6b";
  const changeRequestItem = lockoutIds && selectedEventData
    ? {
        guestCountChangeRequested: selectedEventData[lockoutIds.guestCountChangeRequested] === true,
        menuChangeRequested: selectedEventData[lockoutIds.menuChangeRequested] === true,
        productionAccepted: selectedEventData[lockoutIds.productionAccepted] === true,
        productionAcceptedFlair: selectedEventData[lockoutIds.productionAcceptedFlair] === true,
        productionAcceptedDelivery: selectedEventData[lockoutIds.productionAcceptedDelivery] === true,
        productionAcceptedOpsChief: selectedEventData[lockoutIds.productionAcceptedOpsChief] === true,
      }
    : null;
  const showChangeRequestWarning = changeRequestItem && isChangeRequested(changeRequestItem) && !allBOHConfirmedChange(changeRequestItem);

  const handleBeforeSelectEvent = useCallback(
    async (newEventId: string) => {
      if (!intakeDirty || !selectedEventId) return true;
      setPendingEventId(newEventId);
      return false;
    },
    [intakeDirty, selectedEventId]
  );

  const SECTION_ORDER = ["Passed Appetizers", "Presented Appetizers", "Buffet – Metal", "Buffet – China", "Deli", "Desserts", "Room Temp", "Room Temp / Display"];
  const normalizeSection = (s: string) => s.replace(/\s*[-–—]\s*/g, " – ").trim();
  const bySection = shadowMenuRows.reduce<Record<string, (EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] })[]>>((acc, row) => {
    const raw = row.section || "Other";
    const s = SECTION_ORDER.find((o) => normalizeSection(o) === normalizeSection(raw)) ?? raw;
    if (!acc[s]) acc[s] = [];
    acc[s].push(row);
    return acc;
  }, {});
  const SECTION_COLORS: Record<string, string> = {
    "Passed Appetizers": "#D32F2F",
    "Presented Appetizers": "#FBC02D",
    "Deli": "#4CAF50",
    "Buffet – Metal": "#4DD0E1",
    "Buffet – China": "#E8E8E8",
    "Desserts": "#7B1FA2",
    "Room Temp": "#757575",
    "Room Temp / Display": "#757575",
  };

  const btnStyle = { padding: "2px 8px", fontSize: 11, borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#e0e0e0", cursor: isLocked ? "default" as const : "pointer" as const };

  const [creationStationMenuNames, setCreationStationMenuNames] = useState<Record<string, string>>({});
  const fetchCreationStationItemNames = useCallback(
    async (eventId: string | null, recordIds: string[], options?: { clearWhenEmpty?: boolean }) => {
      if (!recordIds?.length) {
        if (options?.clearWhenEmpty) setCreationStationMenuNames({});
        return;
      }
      const unique = [...new Set(recordIds.filter((id) => typeof id === "string" && id.startsWith("rec")))];
      if (unique.length === 0) {
        if (options?.clearWhenEmpty) setCreationStationMenuNames({});
        return;
      }
      const names = await fetchMenuItemNamesByIds(unique);
      if (eventId && useEventStore.getState().selectedEventId !== eventId) return;
      if (options?.clearWhenEmpty) setCreationStationMenuNames(names);
      else setCreationStationMenuNames((prev) => ({ ...prev, ...names }));
    },
    []
  );
  const getCreationStationItemName = useCallback(
    (id: string) => creationStationMenuNames[id] ?? id,
    [creationStationMenuNames]
  );
  const creationStationLabelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4, display: "block" };
  const creationStationInputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 14 };
  const creationStationButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    border: "1px solid rgba(139,92,246,0.45)",
    background: "rgba(139,92,246,0.12)",
    color: "#c4b5fd",
    cursor: isLocked ? "default" : "pointer",
  };
  const creationStationSmallAddStyle: React.CSSProperties = { ...creationStationButtonStyle, padding: "6px 12px", fontSize: 12 };
  const emptyMenuItemsForStations: LinkedRecordItem[] = [];

  /** Violet pill — scrolls to BEO stations block inside Menu (distinct from other menu pill colors). */
  const STATIONS_MENU_PILL = "#9333ea";
  const scrollToBeoStations = useCallback(() => {
    jumpToBeoSection("beo-section-menu");
    setTimeout(() => {
      const el = document.getElementById("beo-creation-stations");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = `2px solid ${STATIONS_MENU_PILL}`;
      el.style.outlineOffset = "3px";
      // Auto-open the add station form
      el.dispatchEvent(new CustomEvent("openAddStationForm", { bubbles: true }));
      setTimeout(() => {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }, 1400);
    }, 280);
  }, []);

  return (
    <div
      className={`beo-intake-page${isDelivery ? " beo-intake-page--delivery" : ""}`}
      style={{
        minHeight: "100vh",
        background: isDelivery
          ? "linear-gradient(145deg, #0f0c04 0%, #1a1408 42%, #0a0906 100%)"
          : "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
        color: "#e0e0e0",
        position: "relative",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div style={{ position: "relative", zIndex: 10 }}>
        <div
          className="beo-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: isDelivery ? "1px solid rgba(234,179,8,0.35)" : "1px solid rgba(204,0,0,0.25)",
            backdropFilter: "blur(10px)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div className="beo-header-selector" style={{ minWidth: "220px", maxWidth: "320px" }}>
            <EventSelectorSimple onBeforeSelectEvent={handleBeforeSelectEvent} />
          </div>
          <Link to={DASHBOARD_CALENDAR_TO} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "#cc0000", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, flexShrink: 0 }}>
              <span style={{ transform: "rotate(-45deg)", fontFamily: "'Great Vibes', cursive", fontSize: 20, color: "#fff" }}>W</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 22, fontWeight: 400, color: "#fff", lineHeight: 1 }}>Werx</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1 }}>Event Builder</span>
            </div>
          </Link>
          <div style={{ minWidth: "220px", maxWidth: "320px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            {selectedEventId && (
              <Link to={`/event/${selectedEventId}`} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, textDecoration: "none", letterSpacing: "0.2px" }}>
                Overview
              </Link>
            )}
            {!isDelivery && selectedEventId && (
              <button type="button" onClick={() => setFields(selectedEventId, { [FIELD_IDS.EVENT_TYPE]: "Delivery" })} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid rgba(234,179,8,0.5)", background: "rgba(234,179,8,0.08)", color: "#eab308", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Switch to Delivery
              </button>
            )}
          </div>
        </div>
        {isDelivery && selectedEventId && (
          <div className="beo-delivery-banner" style={{ background: "linear-gradient(90deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02))", borderBottom: "1px solid rgba(234,179,8,0.3)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>🚚</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#eab308", textTransform: "uppercase", letterSpacing: "1px" }}>Delivery Order</span>
            </div>
            <button type="button" onClick={() => setFields(selectedEventId, { [FIELD_IDS.EVENT_TYPE]: "Full Service" })} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid rgba(0,188,212,0.5)", background: "rgba(0,188,212,0.08)", color: "#00bcd4", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Switch to Full Service
            </button>
          </div>
        )}
        {showChangeRequestWarning && (
          <div className="beo-change-request-warning" style={{ background: "linear-gradient(90deg, rgba(234,179,8,0.25), rgba(234,179,8,0.08))", borderBottom: "3px solid #eab308", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "28px" }}>⚠️</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#eab308", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Event details were changed</div>
              <div style={{ fontSize: "15px", color: "#fef08a", fontWeight: "600" }}>BOH must confirm receipt before production resumes.</div>
            </div>
          </div>
        )}
        <div className="beo-content" style={{ position: "relative", zIndex: 1, padding: "20px 24px", minHeight: "calc(100vh - 100px)", paddingBottom: "140px", maxWidth: "1600px", margin: "0 auto", color: "#e0e0e0" }}>
          {selectedEventId ? (
            <div style={{ position: "relative" }}>
              {eventDataLoading && (
                <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.45)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "all" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>⏳</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#ff6b6b" }}>Loading event...</div>
                  </div>
                </div>
              )}
              <div className="beo-main-layout" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <div className="beo-live-preview-sidebar" style={{ width: "400px", flexShrink: 0, position: "sticky", top: 80, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 8, textAlign: "center" }}>Live Preview</div>
                  <BeoLivePreview shadowMenuRows={shadowMenuRows} />
                </div>
                <div className="beo-main-content" style={{ flex: 1, minWidth: 0 }}>
                  <div className="beo-sections-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "16px", alignItems: "stretch", width: "100%" }}>
                    <div
                      className={`beo-header-form-grid${!isDelivery ? " beo-full-service-intake-grid" : ""}`}
                      style={{
                        position: "relative",
                        display: "grid",
                        gap: "16px",
                        alignItems: "stretch",
                        width: "100%",
                        ...(isDelivery ? { gridTemplateColumns: "minmax(0, 1fr)" } : {}),
                      }}
                    >
                      {isLocked && (
                        <div
                          className={`beo-locked-overlay ${canSubmitChangeRequest ? "beo-locked-foh" : "beo-locked-boh"}`}
                          onClick={handleFormInteraction}
                          aria-label={canSubmitChangeRequest ? "Event is locked. Click to submit a change request." : "Event is locked. Only FOH can submit a change request to unlock."}
                        />
                      )}
                      <div className="beo-grid-span-full">
                        <HeaderSection jobNumberDisplay={jobNumberDisplay} dispatchTimeDisplay={dispatchTimeDisplay} canEditDispatch={canEditDispatch} eventDate={eventDateNorm} />
                      </div>
                      {isDelivery ? (
                        <div className="beo-grid-span-full">
                          <EventCoreSection isDelivery hideHeaderFields />
                        </div>
                      ) : null}
                      <div className="beo-grid-span-full">
                        <FormSection
                          title="Menu"
                          defaultOpen={!isDelivery || shadowMenuRows.length > 0}
                          sectionId="beo-section-menu"
                          titleAlign="center"
                          dotColor={BEO_SECTION_PILL_ACCENT}
                          isDelivery={isDelivery}
                        >
                          <div className="beo-menu-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, gridColumn: "1 / -1", width: "100%", maxWidth: "100%", margin: "0 auto" }}>
                            {!isDelivery && (
                            <div className="beo-menu-add-buttons" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px", alignItems: "flex-start" }}>
                                {(
                                  [
                                    ["+ Passed", "#D32F2F", () => openPicker("passed", "passedApps", "Passed Appetizers")],
                                    ["+ Presented", "#FBC02D", () => openPicker("presented", "presentedApps", "Presented Appetizers")],
                                    ["+ Station", STATIONS_MENU_PILL, scrollToBeoStations],
                                    ["+ Buffet Metal", "#4DD0E1", () => openPicker("buffet_metal", "buffetMetal", "Buffet – Metal")],
                                    ["+ Buffet China", "#FF8A65", () => openPicker("buffet_china", "buffetChina", "Buffet – China")],
                                    ["+ Deli", "#4CAF50", () => openPicker("deli", "fullServiceDeli", "Deli")],
                                    ["+ Desserts", "#7B1FA2", () => openPicker("desserts", "desserts", "Desserts")],
                                  ] as const
                                ).map(([label, color, onClick]) => (
                                  <button key={label} type="button" disabled={isLocked} onClick={onClick} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${color}38`, background: `${color}12`, color: `${color}`, cursor: isLocked ? "default" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.2px" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, opacity: 0.85 }} />
                                    {label}
                                  </button>
                                ))}
                                <button type="button" disabled={isLocked} onClick={() => setShowPackagesPanel(true)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #7c3aed", background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(124,58,237,0.15))", color: "#c4b5fd", cursor: isLocked ? "default" : "pointer", flexShrink: 0 }}>
                                  📦 Packages
                                </button>
                                <button type="button" disabled={isLocked} onClick={() => setShowGlobalSearch(true)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", cursor: isLocked ? "default" : "pointer", flexShrink: 0 }}>
                                  🔍 Find Any Item
                                </button>
                            </div>
                            )}
                            {!isDelivery && (
                            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                                <button type="button" onClick={() => { if (selectedEventId) navigate(`/beo-print/${selectedEventId}?editMode=1`); }} disabled={!selectedEventId} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: selectedEventId ? "pointer" : "default", opacity: selectedEventId ? 1 : 0.4 }}>
                                  📄 Edit BEO
                                </button>
                                <button type="button" onClick={() => { if (selectedEventId) setShowQuestionnaireModal(true); }} disabled={!selectedEventId} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #0d9488", background: "rgba(13,148,136,0.15)", color: "#5eead4", cursor: selectedEventId ? "pointer" : "default", opacity: selectedEventId ? 1 : 0.4 }}>
                                  ✉️ Send Questionnaire
                                </button>
                            </div>
                            )}
                            {isDelivery && (
                              <>
                                <DeliveryIntakeMenuAddRow
                                  disabled={isLocked}
                                  onOpenPackages={() => setShowPackagesPanel(true)}
                                  onOpenGlobalSearch={() => setShowGlobalSearch(true)}
                                />
                                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6 }}>
                                  <button type="button" onClick={() => { if (selectedEventId) navigate(`/beo-print/${selectedEventId}?editMode=1`); }} disabled={!selectedEventId} style={{ padding: "7px 18px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: selectedEventId ? "pointer" : "default", opacity: selectedEventId ? 1 : 0.4 }}>
                                    📄 Edit BEO
                                  </button>
                                  <button type="button" onClick={() => { if (selectedEventId) setShowQuestionnaireModal(true); }} disabled={!selectedEventId} style={{ padding: "7px 18px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: "1px solid #0d9488", background: "rgba(13,148,136,0.15)", color: "#5eead4", cursor: selectedEventId ? "pointer" : "default", opacity: selectedEventId ? 1 : 0.4 }}>
                                    ✉️ Send Questionnaire
                                  </button>
                                </div>
                              </>
                            )}
                            {(!isDelivery || deliveryMenuBodyVisible) &&
                            (shadowMenuRows.length === 0 ? (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.5)",
                                  padding: "8px 0",
                                  textAlign: "center",
                                  maxWidth: 560,
                                  margin: "0 auto",
                                  lineHeight: 1.5,
                                }}
                              >
                                <div>
                                  {isDelivery
                                    ? "No items yet. Use the category buttons above to add from the menu, boxed lunches, or sandwich platters."
                                    : "No items yet. Use the buttons above to add items."}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: 10, textAlign: "center", letterSpacing: "0.04em" }}>
                                  YOUR FOOD LIST
                                </div>
                                {(() => {
                                  const sectionsToRender = deliveryFoodListSectionKeys(false, bySection, SECTION_ORDER);
                                  const toggleSectionHeader = (sec: string) => {
                                    setShadowMenuSectionExpanded((p) =>
                                      p[sec] === false
                                        ? (() => {
                                            const { [sec]: _removed, ...rest } = p;
                                            return rest;
                                          })()
                                        : { ...p, [sec]: false }
                                    );
                                  };
                                  return sectionsToRender.map((section) => {
                                const rowsForSection = bySection[section] || [];
                                const guestCount = selectedEventData?.[FIELD_IDS.GUEST_COUNT] != null ? Number(selectedEventData[FIELD_IDS.GUEST_COUNT]) : 0;
                                const tableBorder = "1px solid rgba(255,255,255,0.15)";
                                const sectionColor = SECTION_COLORS[section] || "#888";
                                const sectionExpanded = shadowMenuSectionExpanded[section] !== false;
                                const headerLabel = section.toUpperCase();
                                return (
                                  <div key={section} style={{ width: "100%", marginBottom: 12, border: tableBorder, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)", overflow: "hidden" }}>
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      aria-expanded={sectionExpanded}
                                      onClick={() => toggleSectionHeader(section)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          toggleSectionHeader(section);
                                        }
                                      }}
                                      style={{ padding: "8px 12px", background: "rgba(0,0,0,0.15)", borderBottom: sectionExpanded ? tableBorder : "none", cursor: "pointer" }}
                                    >
                                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <tbody>
                                          <tr>
                                            <td style={{ width: 100, minWidth: 100, padding: 0 }} />
                                            <td style={{ padding: 0, textAlign: "center" }}>
                                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginRight: 6, userSelect: "none" }} aria-hidden>
                                                {sectionExpanded ? "▼" : "▶"}
                                              </span>
                                              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: sectionColor }}>{headerLabel}</span>
                                            </td>
                                            <td style={{ width: 140, minWidth: 140, padding: 0, textAlign: "right" }}>
                                              <button
                                                type="button"
                                                disabled={isLocked}
                                                onClick={(e) => { e.stopPropagation(); setShowPackagesPanel(true); }}
                                                style={{ padding: "3px 10px", fontSize: 11, fontWeight: 700, borderRadius: 5, border: "1px solid #7c3aed", background: "rgba(124,58,237,0.2)", color: "#c4b5fd", cursor: isLocked ? "default" : "pointer", whiteSpace: "nowrap" }}
                                              >
                                                📦 Packages
                                              </button>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                    {sectionExpanded && (
                                    <div style={{ padding: "8px 12px" }}>
                                      {rowsForSection.map((row, rowIdx) => {
                                        const rowSection = row.section?.trim();
                                        if (!rowSection) return null;
                                        const fieldId = getFieldIdForSection(rowSection, isDelivery);
                                        const category = SECTION_TO_CATEGORY[rowSection] ?? "buffet";
                                        const fullName = row.customText?.trim() ? row.customText : row.catalogItemName;
                                        const hasNameSuffix = fullName.includes(" – ");
                                        const parentName = hasNameSuffix ? (fullName.split(" – ")[0]?.trim() || fullName) : fullName;
                                        const nameSuffixChild = hasNameSuffix ? (fullName.split(" – ")[1]?.trim() || null) : null;
                                        const components = row.components ?? [];
                                        const itemId = row.catalogItemId ?? row.id;
                                        const parentSpecKey = getSpecOverrideKey(fieldId, itemId, 0);
                                        const autoSpec = calculateAutoSpec(parentName, category, guestCount);
                                        const displaySpec = (menuSpecOverrides[parentSpecKey] ?? "").trim() !== "" ? menuSpecOverrides[parentSpecKey] : autoSpec.quantity;
                                        const showSauceRow = (rowSection === "Passed Appetizers" || rowSection === "Presented Appetizers") && (components.length > 0 || row.sauceOverride);
                                        const sauceSpecKey = getSpecOverrideKey(fieldId, itemId, 1);
                                        const sauceVal = row.sauceOverride?.trim();
                                        const sauceDisplay = !sauceVal || sauceVal === "None" ? null : sauceVal === "Default" ? "Default" : sauceVal;
                                        const componentsStartIdx = nameSuffixChild ? 2 : (showSauceRow && sauceDisplay ? 2 : 1);
                                        const inputStyle = { width: "100%", minWidth: 140, padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 12, lineHeight: 1.2 };
                                        const itemBorder = rowIdx > 0 ? { borderTop: "1px solid rgba(255,255,255,0.12)" } : {};
                                        const childRows: { key: string; specKey: string; label: string }[] = [];
                                        if (nameSuffixChild) childRows.push({ key: "name", specKey: getSpecOverrideKey(fieldId, itemId, 1), label: nameSuffixChild });
                                        if (showSauceRow && sauceDisplay && !nameSuffixChild) childRows.push({ key: "sauce", specKey: sauceSpecKey, label: sauceDisplay });
                                        components.forEach((c, idx) => childRows.push({ key: `c${idx}`, specKey: getSpecOverrideKey(fieldId, itemId, componentsStartIdx + idx), label: c.name }));
                                        return (
                                          <div key={row.id} style={{ padding: "4px 0", ...itemBorder }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, lineHeight: 1.2 }}>
                                              <tbody>
                                              <tr>
                                                <td style={{ width: 100, minWidth: 100, padding: "2px 8px 0", color: "#fff", fontSize: 12, textAlign: "left", verticalAlign: "top" }}>{displaySpec}</td>
                                                <td style={{ padding: "2px 8px 0", color: "#fff", textAlign: "center", verticalAlign: "top" }}><span style={{ fontWeight: 600, fontSize: 13 }}>{parentName}</span></td>
                                                <td style={{ width: 140, minWidth: 140, padding: "2px 0 0", verticalAlign: "top" }}><input type="text" value={menuSpecOverrides[parentSpecKey] ?? ""} disabled={isLocked} onChange={(e) => handleSpecOverrideChange(parentSpecKey, e.target.value)} placeholder="Override" style={inputStyle} /></td>
                                              </tr>
                                              {childRows.map((cr) => (
                                                <tr key={cr.key}>
                                                  <td style={{ width: 100, minWidth: 100, padding: "2px 8px 0", color: "rgba(255,255,255,0.9)", fontSize: 12, textAlign: "left", verticalAlign: "top" }}>{(menuSpecOverrides[cr.specKey] ?? "").trim() || "—"}</td>
                                                  <td style={{ padding: "2px 8px 0", color: "rgba(255,255,255,0.9)", fontSize: 12, textAlign: "center", verticalAlign: "top" }}>• ✓ {cr.label}</td>
                                                  <td style={{ width: 140, minWidth: 140, padding: "2px 0 0", verticalAlign: "top" }}><input type="text" value={menuSpecOverrides[cr.specKey] ?? ""} disabled={isLocked} onChange={(e) => handleSpecOverrideChange(cr.specKey, e.target.value)} placeholder="Override" style={inputStyle} /></td>
                                                </tr>
                                              ))}
                                              <tr>
                                                <td style={{ width: 100, minWidth: 100, padding: "2px 8px 0 8px", paddingBottom: 12, verticalAlign: "top" }} />
                                                <td style={{ padding: "2px 8px 0 8px", paddingBottom: 12, paddingLeft: 0, verticalAlign: "top", textAlign: "center" }}>
                                                  <span style={{ display: "inline-flex", gap: 4 }}>
                                                    <button type="button" disabled={isLocked} onClick={() => { setEditingShadowRow(row); setEditDraft({ customText: row.customText ?? "", packOutNotes: row.packOutNotes ?? "" }); setEditDisplayNameEditing(false); }} style={btnStyle} title="Edit">Edit</button>
                                                    <button type="button" disabled={isLocked} onClick={async () => { setShadowMenuRows((prev) => prev.filter((r) => r.id !== row.id)); await deleteEventMenuRow(row.id); await syncShadowToEvent(selectedEventId!); await loadShadowMenu(); }} style={btnStyle} title="Remove">Remove</button>
                                                  </span>
                                                </td>
                                                <td style={{ width: 140, minWidth: 140, padding: "2px 0 0", paddingBottom: 12, verticalAlign: "top" }} />
                                              </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    )}
                                  </div>
                                );
                                  });
                                })()}
                              </>
                            )
                            )}
                            {isDelivery && selectedEventId && deliveryMenuBodyVisible && (
                              <div style={{ width: "100%", maxWidth: 640, margin: "16px auto 0", display: "flex", flexDirection: "column", gap: 4 }}>
                                <div id="beo-delivery-boxed-lunch">
                                  <CollapsibleSubsection
                                    title="Boxed lunches"
                                    isDelivery
                                    open={deliveryBoxedSectionOpen}
                                    onOpenChange={setDeliveryBoxedSectionOpen}
                                    bodyLayout="block"
                                  >
                                    <BoxedLunchSection
                                      eventId={selectedEventId}
                                      canEdit={!isLocked}
                                      onDone={() => setDeliveryBoxedSectionOpen(false)}
                                    />
                                  </CollapsibleSubsection>
                                </div>
                                <div id="beo-delivery-platter">
                                  <CollapsibleSubsection
                                    title="Sandwich platters"
                                    isDelivery
                                    accentColor="#f97316"
                                    open={deliveryPlatterSectionOpen}
                                    onOpenChange={setDeliveryPlatterSectionOpen}
                                    bodyLayout="block"
                                  >
                                    <SandwichPlatterConfigModal
                                      open={deliveryPlatterSectionOpen}
                                      inline
                                      onClose={() => setDeliveryPlatterSectionOpen(false)}
                                      onConfirm={(rows) => {
                                        if (!selectedEventId) return;
                                        setPlatterOrdersForEvent(selectedEventId, rows);
                                        setDeliveryPlatterSectionOpen(true);
                                      }}
                                      initialRows={getPlatterOrdersByEventId(selectedEventId)}
                                    />
                                  </CollapsibleSubsection>
                                </div>
                              </div>
                            )}
                            {isDelivery && deliveryMenuBodyVisible && (
                              <MenuSection
                                embedded
                                isDelivery
                                deliveryChromeMode="kitchen-only"
                                shadowMenuRows={shadowMenuRows}
                                loadShadowMenu={loadShadowMenu}
                              />
                            )}
                            {selectedEventId && (!isDelivery || deliveryMenuBodyVisible) && (
                              <div id="beo-creation-stations" style={{ width: "100%", marginTop: 20 }}>
                                <CreationStationContent
                                  selectedEventId={selectedEventId}
                                  canEdit={!isLocked}
                                  menuItems={emptyMenuItemsForStations}
                                  menuItemNames={creationStationMenuNames}
                                  getItemName={getCreationStationItemName}
                                  fetchItemNames={fetchCreationStationItemNames}
                                  inputStyle={creationStationInputStyle}
                                  labelStyle={creationStationLabelStyle}
                                  buttonStyle={creationStationButtonStyle}
                                  addButtonStyle={creationStationSmallAddStyle}
                                />
                              </div>
                            )}
                          </div>
                        </FormSection>
                      </div>
                      {!isDelivery && (
                        <div>
                          <FormSection title="Beverage Services" defaultOpen={false} sectionId="beo-section-bar" titleAlign="center" dotColor={BEO_SECTION_PILL_ACCENT} isDelivery={false}>
                            <BeverageServicesSection embedded />
                          </FormSection>
                        </div>
                      )}
                      {isDelivery && selectedEventId && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <DeliveryPaperProductsSection />
                        </div>
                      )}
                      {!isDelivery && <KitchenAndServicewareSection />}
                      {!isDelivery && <TimelineSection />}
                      {!isDelivery && <SiteVisitLogisticsSection />}
                      {!isDelivery ? (
                        <div className="beo-grid-span-full">
                          <EventCoreSection isDelivery={false} hideHeaderFields />
                        </div>
                      ) : null}
                    </div>
                    <ApprovalsLockoutSection eventId={selectedEventId} eventName={eventName} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📋</div>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#ff6b6b", marginBottom: "10px" }}>Select an Event to Begin</h2>
                <p style={{ fontSize: "16px", color: "#888", marginBottom: "20px" }}>Choose an event from the dropdown above to open the Event Builder</p>
              </div>
            </div>
          )}
          {selectedEventId && <BeoJumpToNav isDelivery={isDelivery} />}
          <SubmitChangeRequestModal open={showChangeRequestModal} onClose={() => setShowChangeRequestModal(false)} eventName={eventName} onConfirm={handleSubmitChangeRequest} />
          <ConfirmSendToBOHModal open={showSendToBOHModal} onClose={() => setShowSendToBOHModal(false)} eventName={eventName} onConfirm={handleSendToBOH} />
          {showQuestionnaireModal && selectedEventId && createPortal(
            <div onClick={() => setShowQuestionnaireModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "28px 24px", maxWidth: 540, width: "100%", color: "#f1f5f9" }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>✉️ Client Questionnaire</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
                  Copy the link and paste it into an email to {clientFirstName || "the client"}.
                </div>

                {/* Link */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Form Link</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input readOnly value={getQuestionnaireLink()} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", color: "#5eead4", fontSize: 12, outline: "none" }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <CopyButton text={getQuestionnaireLink()} label="Copy" />
                </div>
                {clientEmail && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Client email: <span style={{ color: "#94a3b8" }}>{clientEmail}</span></div>}
                {!clientEmail && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 20 }}>No client email saved on this event.</div>}

                {/* Pre-written email body */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Pre-written Email (copy &amp; paste)</div>
                <textarea
                  readOnly
                  rows={8}
                  value={getQuestionnaireEmailBody()}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#cbd5e1", fontSize: 12, lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
                  <CopyButton text={getQuestionnaireEmailBody()} label="Copy Email Text" />
                </div>

                <button type="button" onClick={() => setShowQuestionnaireModal(false)} style={{ width: "100%", padding: "10px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>,
            document.body
          )}
          <MissingFieldsModal open={showMissingFieldsModal} onClose={() => setShowMissingFieldsModal(false)} missingFields={getMissingRequiredFields(selectedEventData)} onConfirm={handleMissingFieldsConfirm} />
          <UnsavedChangesModal
            open={showUnsavedModal}
            title="Switch event?"
            onSave={async () => {
              if (selectedEventId) await saveCurrentEvent(selectedEventId);
              setIntakeDirty(false);
              if (pendingEventId) {
                selectEvent(pendingEventId);
                navigate(`/beo-intake/${pendingEventId}`);
                setPendingEventId(null);
              }
            }}
            onDontSave={() => {
              setIntakeDirty(false);
              if (pendingEventId) {
                selectEvent(pendingEventId);
                navigate(`/beo-intake/${pendingEventId}`);
                setPendingEventId(null);
              }
            }}
            onCancel={() => setPendingEventId(null)}
          />
          {editingShadowRow && (
            <div
              className="beo-edit-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="beo-edit-modal-title"
              style={{ position: "fixed", inset: 0, zIndex: 2147483646, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
              onClick={(e) => e.target === e.currentTarget && setEditingShadowRow(null)}
            >
              <div className="beo-edit-modal" style={{ background: "#1a1a1a", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", padding: 20, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div id="beo-edit-modal-title" style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Edit: {editingShadowRow.catalogItemName}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Display name</label>
                    {editDisplayNameEditing ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                        <input type="text" value={editDraft.customText} onChange={(e) => setEditDraft((d) => ({ ...d, customText: e.target.value }))} placeholder={editingShadowRow.catalogItemName} style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #444", background: "#0a0a0a", color: "#fff", fontSize: 14 }} />
                        <button type="button" onClick={() => setEditDisplayNameEditing(false)} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>Done</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: "#fff" }}>{editDraft.customText.trim() || editingShadowRow.catalogItemName || "—"}</span>
                        <button type="button" onClick={() => setEditDisplayNameEditing(true)} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>Edit</button>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 8, paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Added Items</div>
                    {(editChildOverrides.added ?? []).length === 0 ? (
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>No added items</div>
                    ) : (
                      (editChildOverrides.added ?? []).map((label, idx) => (
                        <div key={`added-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ flex: 1, fontSize: 13, color: "#fff" }}>+ {label || "—"}</span>
                          <input type="text" value={label} onChange={(e) => setEditChildOverrides((prev) => { const a = [...(prev.added ?? [])]; a[idx] = e.target.value; return { ...prev, added: a }; })} placeholder="Item name" style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #444", background: "#0a0a0a", color: "#fff", fontSize: 12 }} />
                          <button type="button" onClick={() => setEditChildOverrides((prev) => ({ ...prev, added: (prev.added ?? []).filter((_, i) => i !== idx) }))} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,80,80,0.2)", color: "#ff6b6b", cursor: "pointer" }}>Remove</button>
                        </div>
                      ))
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input type="text" value={editAddNewItem} onChange={(e) => setEditAddNewItem(e.target.value)} placeholder="Add custom sauce or component" style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #444", background: "#0a0a0a", color: "#fff", fontSize: 12 }} />
                      <button type="button" onClick={() => { const v = editAddNewItem.trim(); if (v) { setEditChildOverrides((prev) => ({ ...prev, added: [...(prev.added ?? []), v] })); setEditAddNewItem(""); } }} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 4, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>Add</button>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 8, paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Default Child Items</div>
                    {editDefaultChildren.length === 0 ? (
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>No default child items</div>
                    ) : (
                      editDefaultChildren.map((c) => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <input type="checkbox" checked={(editChildOverrides.overrides?.[c.id]?.enabled ?? true) !== false} onChange={(e) => setEditChildOverrides((prev) => ({ ...prev, overrides: { ...prev.overrides, [c.id]: { ...prev.overrides?.[c.id], enabled: e.target.checked } } }))} />
                          <input type="text" value={editChildOverrides.overrides?.[c.id]?.label ?? c.name} onChange={(e) => setEditChildOverrides((prev) => ({ ...prev, overrides: { ...prev.overrides, [c.id]: { ...prev.overrides?.[c.id], label: e.target.value || undefined } } }))} placeholder={c.name} style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #444", background: "#0a0a0a", color: "#fff", fontSize: 12 }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setEditingShadowRow(null)} style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", cursor: "pointer" }}>Cancel</button>
                  <button
                    type="button"
                    onClick={async () => {
                      const overrides: Record<string, { enabled: boolean; label?: string }> = {};
                      for (const c of editDefaultChildren) {
                        const o = editChildOverrides.overrides?.[c.id];
                        const enabled = o?.enabled ?? true;
                        const labelVal = o?.label?.trim();
                        overrides[c.id] = { enabled };
                        if (labelVal !== undefined && labelVal !== "") overrides[c.id].label = labelVal;
                      }
                      const added = (editChildOverrides.added ?? []).map((s) => s.trim()).filter(Boolean);
                      const hasOverrides = Object.keys(overrides).length > 0;
                      const hasAdded = added.length > 0;
                      const finalCo: ChildOverridesData | null = hasOverrides || hasAdded ? { ...(hasOverrides && { overrides }), ...(hasAdded && { added }) } : null;
                      const updateResult = await updateEventMenuRow(editingShadowRow.id, { customText: editDraft.customText || null, sauceOverride: "Default", packOutNotes: editDraft.packOutNotes || null, childOverrides: finalCo });
                      if (isErrorResult(updateResult)) {
                        console.error("[Event Menu] Save failed:", updateResult);
                        alert(`Failed to save: ${updateResult.message ?? "Unknown error"}`);
                        return;
                      }
                      const mergedComponents: EventMenuRowComponent[] = [
                        ...editDefaultChildren
                          .filter((c) => (editChildOverrides.overrides?.[c.id]?.enabled ?? true) !== false)
                          .map((c) => ({ name: editChildOverrides.overrides?.[c.id]?.label ?? c.name, isRemoved: false, isAdded: false })),
                        ...(editChildOverrides.added ?? []).map((label) => ({ name: label || "—", isRemoved: false, isAdded: true })),
                      ];
                      setShadowMenuRows((prev) =>
                        prev.map((r) =>
                          r.id === editingShadowRow.id
                            ? {
                                ...r,
                                customText: editDraft.customText || null,
                                sauceOverride: "Default",
                                packOutNotes: editDraft.packOutNotes || null,
                                childOverrides: finalCo,
                                components: mergedComponents,
                              }
                            : r
                        )
                      );
                      setEditingShadowRow(null);
                    }}
                    style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          <MenuPickerModal onAdd={handlePickerAdd} onRemove={handlePickerRemove} alreadyAddedIds={pickerAlreadyAddedIds} alreadyAddedNames={pickerAlreadyAddedNames} />
        </div>
      </div>

      {/* ── Global Search Picker — find any item, then choose which section it goes under ── */}
      <GlobalSearchPickerModal
        isOpen={showGlobalSearch}
        isDelivery={isDelivery}
        onAdd={(item) => {
          setShowGlobalSearch(false);
          handlePickerAdd(item);
        }}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* ── Packages Panel — available for both full-service and delivery events ── */}
      {showPackagesPanel && createPortal(
        <DeliveryPackagesPanel
          onSelectPackage={handlePanelSelectPackage}
          onOpenBoxedLunches={isDelivery ? () => {
            setShowPackagesPanel(false);
            setDeliveryRevealFoodChrome(true);
            setDeliveryBoxedSectionOpen(true);
            requestAnimationFrame(() =>
              document.getElementById("beo-delivery-boxed-lunch")?.scrollIntoView({ behavior: "smooth", block: "start" })
            );
          } : null}
          onOpenSandwichPlatters={isDelivery ? () => {
            setShowPackagesPanel(false);
            setDeliveryRevealFoodChrome(true);
            setDeliveryPlatterSectionOpen(true);
            requestAnimationFrame(() =>
              document.getElementById("beo-delivery-platter")?.scrollIntoView({ behavior: "smooth", block: "start" })
            );
          } : null}
          onClose={() => setShowPackagesPanel(false)}
          disabled={isLocked}
        />,
        document.body
      )}

      {/* ── Delivery Package Config Modal (choice packages: "It's Your Choice Breakfast", platters, etc.) ── */}
      {pendingPackageItem && createPortal(
        <DeliveryPackageConfigModal
          preset={pendingPackageItem.preset}
          itemName={pendingPackageItem.name}
          onConfirm={handlePackageConfirm}
          onCancel={() => setPendingPackageItem(null)}
        />,
        document.body
      )}

      {/* ── Dressing Picker (auto-opens when a salad is added to Buffet China) ── */}
      {dressingPickerSalad && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#111827", borderRadius: 12, border: "2px solid #3b82f6", maxWidth: 520, width: "100%", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(59,130,246,0.35)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#f9fafb" }}>Select Dressings</div>
                  <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 4 }}>for {dressingPickerSalad.name}</div>
                </div>
                <button onClick={() => setDressingPickerSalad(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>✕</button>
              </div>
              <input
                type="text"
                placeholder="Search dressings..."
                value={dressingPickerSearch}
                onChange={(e) => setDressingPickerSearch(e.target.value)}
                autoFocus
                style={{ marginTop: 12, width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #374151", backgroundColor: "#1f2937", color: "#f9fafb", fontSize: 14, boxSizing: "border-box" as const }}
              />
              {pendingDressingIds.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#93c5fd" }}>{pendingDressingIds.length} selected</div>
              )}
            </div>
            {/* List */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px" }}>
              {dressingPickerItems
                .filter((it) => !dressingPickerSearch.trim() || it.name.toLowerCase().includes(dressingPickerSearch.toLowerCase()))
                .map((it) => {
                  const isPending = pendingDressingIds.includes(it.id);
                  return (
                    <div
                      key={it.id}
                      onClick={() => setPendingDressingIds((prev) => isPending ? prev.filter((x) => x !== it.id) : [...prev, it.id])}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 6, backgroundColor: isPending ? "rgba(59,130,246,0.12)" : "#1f2937", border: `1px solid ${isPending ? "#3b82f6" : "#374151"}`, borderRadius: 8, cursor: "pointer", color: "#f9fafb", fontSize: 14, transition: "all 0.15s" }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isPending ? "#3b82f6" : "#4b5563"}`, backgroundColor: isPending ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#fff", fontWeight: "bold" }}>
                        {isPending && "✓"}
                      </div>
                      {it.name}
                    </div>
                  );
                })}
              {dressingPickerItems.length === 0 && (
                <div style={{ color: "#6b7280", fontSize: 13, padding: "8px 0" }}>Loading dressings…</div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(59,130,246,0.25)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                onClick={async () => {
                  if (pendingDressingIds.length > 0 && selectedEventId) {
                    // Create a shadow row for each dressing so they appear in the live view
                    // AND sync to the Events table BUFFET_CHINA field for print
                    const alreadyInShadow = new Set(
                      shadowMenuRows.filter((r) => r.section === "Buffet \u2013 China").map((r) => r.catalogItemId)
                    );
                    for (const dressingId of pendingDressingIds) {
                      if (alreadyInShadow.has(dressingId)) continue;
                      const result = await createEventMenuRow(selectedEventId, "Buffet \u2013 China", dressingId);
                      if (result && !("error" in result)) {
                        const dressingName = dressingPickerItems.find((it) => it.id === dressingId)?.name ?? dressingId;
                        setShadowMenuRows((prev) => [...prev, {
                          id: (result as { id: string }).id,
                          section: "Buffet \u2013 China",
                          sortOrder: 0,
                          catalogItemId: dressingId,
                          displayName: null,
                          customText: null,
                          sauceOverride: null,
                          packOutNotes: null,
                          parentItemId: null,
                          childOverrides: null,
                          catalogItemName: dressingName,
                          components: [],
                        }]);
                      }
                    }
                    await syncShadowToEvent(selectedEventId);
                    await loadShadowMenu();
                    await loadEventData(selectedEventId);
                  }
                  setDressingPickerSalad(null);
                }}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                {pendingDressingIds.length > 0 ? `Add ${pendingDressingIds.length} dressing${pendingDressingIds.length > 1 ? "s" : ""}` : "Skip / Done"}
              </button>
              <button
                type="button"
                onClick={() => setDressingPickerSalad(null)}
                style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #374151", backgroundColor: "transparent", color: "#9ca3af", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <BeoIntakeActionBar eventId={selectedEventId} isLocked={isLocked} onReopenRequest={isLocked && canSubmitChangeRequest ? () => setShowChangeRequestModal(true) : undefined} onSendToBOH={!isDelivery && !isLocked ? handleClickSendToBOH : undefined} shadowMenuRows={shadowMenuRows} />
    </div>
  );
};
