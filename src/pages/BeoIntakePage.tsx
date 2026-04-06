import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, type ReactNode } from "react";
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
import { canEditDispatchAndJobNumber } from "../lib/auth";
import { isDeliveryOrPickup } from "../lib/deliveryHelpers";
import { deliveryFoodListSectionKeys } from "../lib/deliveryShadowSectionLabels";
import { isChangeRequested, allBOHConfirmedChange } from "../lib/productionHelpers";
import { asSingleSelectName, asString, isErrorResult } from "../services/airtable/selectors";
import { FIELD_IDS, getLockoutFieldIds, getBOHProductionFieldIds } from "../services/airtable/events";
import { secondsTo12HourString } from "../utils/timeHelpers";
import { createTask } from "../services/airtable/tasks";
import { MenuPickerModal } from "../components/MenuPickerModal";
import { usePickerStore } from "../state/usePickerStore";
import { updateMenuItemVesselType, VESSEL_TYPE_VALUES, fetchMenuItemNamesByIds } from "../services/airtable/menuItems";
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
import { fetchMenuItemChildren } from "../services/airtable/menuItems";
import { CreationStationContent, MenuSection } from "../components/beo-intake/MenuSection";
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

export const BeoIntakePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { loadEvents, selectedEventId, selectEvent, setSelectedEventId, setFields, loadEventData, eventDataLoading, selectedEventData, intakeDirty, setIntakeDirty, saveCurrentEvent, events } = useEventStore();
  const [lockoutIds, setLockoutIds] = useState<Awaited<ReturnType<typeof getLockoutFieldIds>>>(null);
  const [bohIds, setBohIds] = useState<Awaited<ReturnType<typeof getBOHProductionFieldIds>>>(null);
  const [showSendToBOHModal, setShowSendToBOHModal] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [shadowMenuRows, setShadowMenuRows] = useState<(EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] })[]>([]);
  /** Skip next sessionStorage write for shadow menu — avoids persisting previous event's rows under the new event id (passive effect can run before rows clear). */
  const shadowMenuStorageSkipRef = useRef(false);
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

  const eventDateRaw = selectedEventData ? asString(selectedEventData[FIELD_IDS.EVENT_DATE]) : "";
  const eventDateNorm = (eventDateRaw || "").trim();
  const sameDayEvents = events.filter((e) => (e.eventDate || "").trim() === eventDateNorm);
  const sortedByDispatch = [...sameDayEvents].sort((a, b) => (a.dispatchTimeSeconds ?? 999999) - (b.dispatchTimeSeconds ?? 999999));
  const jobIndex = selectedEventId ? sortedByDispatch.findIndex((e) => e.id === selectedEventId) + 1 : 0;
  const jobNumberDisplay = jobIndex > 0 ? String(jobIndex).padStart(3, "0") : "—";
  const dispatchTimeDisplay = selectedEventData ? secondsTo12HourString(selectedEventData[FIELD_IDS.DISPATCH_TIME]) : "—";
  const canEditDispatch = canEditDispatchAndJobNumber(user?.role ?? null);

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
      const loadStale = () => useEventStore.getState().selectedEventId !== eventIdForThisLoad;

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
      for (const id of uniqueCatalogIds) {
        const children = await fetchMenuItemChildren(id);
        childrenMap[id] = Array.isArray(children) ? children : [];
      }
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
    if (!sid || shadowMenuRows.length === 0) return;
    try {
      sessionStorage.setItem(getShadowMenuStorageKey(sid), JSON.stringify(shadowMenuRows));
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
          taskType: "BEO Missing",
          dueDate,
          status: "Pending",
        });
      }
      setShowMissingFieldsModal(false);
    },
    [selectedEventId, selectedEventData]
  );

  const handlePickerAdd = useCallback(
    async (item: { id: string; name: string }) => {
      const targetField = usePickerStore.getState().targetField;
      if (!selectedEventId || !targetField) return;
      const mappedSection = targetFieldToSection(targetField);
      if (!mappedSection) return;

      const createResult = await createEventMenuRow(selectedEventId, mappedSection, item.id);
      if (createResult && "error" in createResult) return;

      const newRow: EventMenuRow & { catalogItemName: string; components?: EventMenuRowComponent[] } = {
        id: (createResult as { id: string }).id,
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

  const targetField = usePickerStore((s) => s.targetField);
  const openPicker = usePickerStore((s) => s.openPicker);
  const pickerAlreadyAddedIds = (() => {
    if (!targetField) return [];
    const section = targetFieldToSection(targetField);
    if (!section) return [];
    return shadowMenuRows
      .filter((r) => r.section === section && r.catalogItemId)
      .map((r) => r.catalogItemId as string);
  })();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (usePickerStore.getState().isOpen) return;
      if (usePickerStore.getState().isWithinCloseGrace()) return;
      const target = e.target as HTMLElement;
      if (target.closest(".picker-modal-backdrop") || target.closest(".picker-modal") || target.closest(".picker-done-button") || target.closest(".station-config-modal") || target.closest(".station-picker-modal")) return;
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
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #cc0000, #ff3333)", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, boxShadow: "0 0 20px rgba(204,0,0,0.4)" }}>
              <span style={{ transform: "rotate(-45deg)", fontFamily: "'Great Vibes', cursive", fontSize: 24, color: "#fff", textShadow: "0 0 12px rgba(255,255,255,0.9)" }}>W</span>
            </div>
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 28, fontWeight: 400, color: "#fff", textShadow: "0 0 12px rgba(255,255,255,0.9)" }}>Werx</span>
          </Link>
          <div style={{ minWidth: "220px", maxWidth: "320px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            {selectedEventId && (
              <Link to={`/event/${selectedEventId}`} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#e0e0e0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Event Overview
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
                      <div className="beo-grid-span-full">
                        <FormSection
                          title="Menu"
                          defaultOpen={true}
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
                                  <button key={label} type="button" disabled={isLocked} onClick={onClick} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${color}80`, background: `linear-gradient(135deg, ${color}40, ${color}15)`, color, cursor: isLocked ? "default" : "pointer", flexShrink: 0 }}>
                                    {label}
                                  </button>
                                ))}
                            </div>
                            )}
                            {!isDelivery && (
                            shadowMenuRows.length === 0 ? (
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
                                <div>No items yet. Use the buttons above to add items.</div>
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
                                            <td style={{ width: 140, minWidth: 140, padding: 0 }} />
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                    {sectionExpanded && (
                                    <div style={{ padding: "8px 12px" }}>
                                      {rowsForSection.map((row, rowIdx) => {
                                        const rowSection = row.section?.trim();
                                        if (!rowSection) return null;
                                        const fieldId = getFieldIdForSection(rowSection, false);
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
                                                    <button type="button" disabled={isLocked} onClick={async () => { await deleteEventMenuRow(row.id); await syncShadowToEvent(selectedEventId!); await loadShadowMenu(); }} style={btnStyle} title="Remove">Remove</button>
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
                            {isDelivery && <MenuSection embedded isDelivery />}
                            {selectedEventId && (
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
                      <div style={isDelivery ? { gridColumn: "1 / -1" } : undefined}>
                        <FormSection title="Beverage Services" defaultOpen={false} sectionId="beo-section-bar" titleAlign="center" dotColor={BEO_SECTION_PILL_ACCENT} isDelivery={isDelivery}>
                          <BeverageServicesSection embedded />
                        </FormSection>
                      </div>
                      {isDelivery && selectedEventId && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <DeliveryPaperProductsSection />
                        </div>
                      )}
                      {!isDelivery && <KitchenAndServicewareSection />}
                      {!isDelivery && <TimelineSection />}
                      {!isDelivery && <SiteVisitLogisticsSection />}
                      <div className="beo-grid-span-full">
                        <EventCoreSection isDelivery={isDelivery} hideHeaderFields />
                      </div>
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
                <p style={{ fontSize: "16px", color: "#888", marginBottom: "20px" }}>Choose an event from the dropdown above to access the BEO intake form</p>
              </div>
            </div>
          )}
          {selectedEventId && <BeoJumpToNav isDelivery={isDelivery} />}
          <SubmitChangeRequestModal open={showChangeRequestModal} onClose={() => setShowChangeRequestModal(false)} eventName={eventName} onConfirm={handleSubmitChangeRequest} />
          <ConfirmSendToBOHModal open={showSendToBOHModal} onClose={() => setShowSendToBOHModal(false)} eventName={eventName} onConfirm={handleSendToBOH} />
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
            <div className="beo-edit-modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 2147483646, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => e.target === e.currentTarget && setEditingShadowRow(null)}>
              <div className="beo-edit-modal" style={{ background: "#1a1a1a", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", padding: 20, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Edit: {editingShadowRow.catalogItemName}</div>
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

                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Pack-Out Notes</label>
                  <input type="text" value={editDraft.packOutNotes} onChange={(e) => setEditDraft((d) => ({ ...d, packOutNotes: e.target.value }))} placeholder="Notes" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #444", background: "#0a0a0a", color: "#fff", fontSize: 14 }} />

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
          <MenuPickerModal onAdd={handlePickerAdd} alreadyAddedIds={pickerAlreadyAddedIds} />
        </div>
      </div>
      <BeoIntakeActionBar eventId={selectedEventId} isLocked={isLocked} onReopenRequest={isLocked && canSubmitChangeRequest ? () => setShowChangeRequestModal(true) : undefined} onSendToBOH={!isDelivery && !isLocked ? handleClickSendToBOH : undefined} shadowMenuRows={shadowMenuRows} />
    </div>
  );
};
