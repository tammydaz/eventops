import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { EventSelector } from "./components/intake/EventSelector";
import { Router } from "./router";
import { useEventStore } from "./state/eventStore";
import { AuthGuard } from "./components/AuthGuard";
import { DASHBOARD_CALENDAR_TO } from "./lib/dashboardRoutes";

function App() {
  const { selectedEventId, loadEvents, saveError, selectEvent } = useEventStore();
  const { pathname } = useLocation();
  const isPrintTest = pathname.startsWith("/print-test");
  const isHome = pathname === "/" || pathname.startsWith("/home");
  const isQuickIntake = pathname.startsWith("/quick-intake");
  const isWatchtower = pathname.startsWith("/watchtower");
  const isPapaChulo = pathname.startsWith("/papa-chulo");
  const isFOH = pathname.startsWith("/foh");
  const isDashboardOld = pathname.startsWith("/dashboard-old");
  const isBeoIntake = pathname.startsWith("/beo-intake");
  const isBeoPrint = pathname.startsWith("/beo-print");
  const isSeedDemo = pathname.startsWith("/seed-demo");
  const isInvoiceIntake = pathname.startsWith("/invoice-intake");
  const isFeedbackIssues = pathname.startsWith("/feedback-issues");
  const isAdmin = pathname.startsWith("/admin");
  const isKitchen = pathname.startsWith("/kitchen");
  const isFlair = pathname === "/flair" || pathname.startsWith("/returned-equipment");
  const isDeliveryCommand = pathname.startsWith("/delivery-command");
  const isIntakeFOH = pathname.startsWith("/intake-foh");
  const isEventOverview = pathname.startsWith("/event/");
  const isClientOverview = pathname.startsWith("/client/");
  const isDeliveryIntake = pathname === "/delivery/intake";
  const isEarlyEventSections = pathname.startsWith("/early-event-sections");
  const isClientForm = pathname.startsWith("/client-form/");

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!pathname.startsWith("/beo-intake/")) return;

    const raw = pathname.split("/beo-intake/")[1] ?? "";
    const eventIdFromUrl = raw.split("/")[0]?.trim() ?? "";
    if (!eventIdFromUrl) return;

    const currentId = useEventStore.getState().selectedEventId;

    if (eventIdFromUrl !== currentId) {
      selectEvent(eventIdFromUrl);
    }
  }, [pathname, selectEvent]);

  // Public routes — no auth required
  if (isClientForm) {
    return <Router selectedEventId={selectedEventId} />;
  }

  if (isPrintTest || isHome || isQuickIntake || isWatchtower || isPapaChulo || isFOH || isDashboardOld || isBeoIntake || isBeoPrint || isSeedDemo || isInvoiceIntake || isFeedbackIssues || isAdmin || isKitchen || isFlair || isDeliveryCommand || isIntakeFOH || isEventOverview || isClientOverview || isDeliveryIntake || isEarlyEventSections) {
    return (
      <AuthGuard>
        <Router selectedEventId={selectedEventId} />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen text-gray-100">
      <div className="fwx-shell">
        {saveError ? (
          <div className="mb-4 rounded-md border border-red-600 bg-red-950/60 px-4 py-2 text-xs text-red-200">
            Error saving — retrying…
          </div>
        ) : null}
        {!isBeoIntake && (
          <header className="fwx-header rounded-lg p-8 mb-8 flex flex-wrap items-center justify-between gap-4">
            <a href={DASHBOARD_CALENDAR_TO} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-600 bg-gray-800/60 text-gray-200 hover:bg-gray-700/60 transition text-sm font-medium">
              ← Back to Dashboard
            </a>
            <div className="flex items-center gap-2">
              <EventSelector />
            </div>
          </header>
        )}

        <Router selectedEventId={selectedEventId} />
      </div>
    </div>
    </AuthGuard>
  );
}

export default App;
