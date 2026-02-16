import { useEffect } from "react";
import { EventSelector } from "./components/intake/EventSelector";
import { Router } from "./router";
import { useEventStore } from "./state/eventStore";

function App() {
  const { selectedEventId, loadEvents, saveError, selectEvent } = useEventStore();
  const pathname = window.location.pathname;
  const isPrintTest = pathname.startsWith("/print-test");
  const isHome = pathname === "/" || pathname.startsWith("/home");
  const isQuickIntake = pathname.startsWith("/quick-intake");
  const isWatchtower = pathname.startsWith("/watchtower");
  const isPapaChulo = pathname.startsWith("/papa-chulo");
  const isFOH = pathname.startsWith("/foh");
  const isDashboardOld = pathname.startsWith("/dashboard-old");
  const isBeoIntake = pathname.startsWith("/beo-intake");

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Extract event ID from URL and load it
  useEffect(() => {
    if (pathname.startsWith("/beo-intake/")) {
      const eventIdFromUrl = pathname.split("/beo-intake/")[1];
      if (eventIdFromUrl && eventIdFromUrl !== selectedEventId) {
        selectEvent(eventIdFromUrl);
      }
    }
  }, [pathname, selectedEventId, selectEvent]);

  if (isPrintTest || isHome || isQuickIntake || isWatchtower || isPapaChulo || isFOH || isDashboardOld || isBeoIntake) {
    console.log("APP RENDERED");
    return <Router selectedEventId={selectedEventId} />;
  }

  console.log("APP RENDERED");
  return (
    <div className="min-h-screen text-gray-100">
      <div className="fwx-shell">
        {saveError ? (
          <div className="mb-4 rounded-md border border-red-600 bg-red-950/60 px-4 py-2 text-xs text-red-200">
            Error saving — retrying…
          </div>
        ) : null}
        {!isBeoIntake && (
          <header className="fwx-header rounded-lg p-8 mb-8">
            <h1 className="fwx-title text-2xl font-bold text-red-500">FOODWERX EVENTOPS</h1>
            <p className="fwx-subtitle text-sm mt-2 uppercase tracking-[0.35em]">BEO Intake</p>
            {!selectedEventId ? (
              <div className="mt-4">
                <EventSelector />
              </div>
            ) : null}
            <div className="mt-4 text-xs text-gray-400">
              Selected Event ID: {selectedEventId ?? "None"}
            </div>
          </header>
        )}

        <Router selectedEventId={selectedEventId} />
      </div>
    </div>
  );
}

export default App;
