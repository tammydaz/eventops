import { lazy, Suspense } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { BeoIntakePage } from "./pages/BeoIntakePage";
import { SeedDemoEventPage } from "./pages/SeedDemoEventPage";
import PrintTestPage from "./pages/PrintTestPage";
import { HomeDashboard } from "./pages/HomeDashboard";
import DashboardPage from "./pages/DashboardPage";
import Watchtower from "./pages/Watchtower";

const FOHLandingPage = lazy(() => import("./pages/FOHLandingPage").then((m) => ({ default: m.default })));
import SpecEngine from "./pages/spec-engine";
import SpecEngineTestPage from "./pages/SpecEngineTestPage";
import BeoPrintPage from "./pages/BeoPrintPage";
import Profit from "./pages/profit";
import Health from "./pages/health";
import PapaChulo from "./pages/PapaChulo";
import OpsChiefDashboard from "./pages/OpsChiefDashboard";
import KitchenPrepPage from "./pages/KitchenPrepPage";
import DeliveryCommandPage from "./pages/DeliveryCommandPage";

const KitchenLandingPage = lazy(() => import("./pages/KitchenLandingPage").then((m) => ({ default: m.default })));
const FlairLandingPage = lazy(() => import("./pages/FlairLandingPage").then((m) => ({ default: m.default })));
const DeliveryLandingPage = lazy(() => import("./pages/DeliveryLandingPage").then((m) => ({ default: m.default })));
const DeliveryIntakeLandingPage = lazy(() =>
  import("./pages/DeliveryIntakeLandingPage").then((m) => ({ default: m.default }))
);
const ClientOverviewPage = lazy(() => import("./pages/ClientOverviewPage").then((m) => ({ default: m.default })));
const OpsChiefLandingPage = lazy(() => import("./pages/OpsChiefLandingPage").then((m) => ({ default: m.default })));
import LeadIntakePage from "./pages/LeadIntakePage";

const IntakeFOHLandingPage = lazy(() => import("./pages/IntakeFOHLandingPage").then((m) => ({ default: m.default })));
import ReturnedEquipmentPage from "./pages/ReturnedEquipmentPage";
import { DepartmentLayout } from "./components/DepartmentLayout";
import PostEventDebriefPage from "./pages/PostEventDebriefPage";
import KitchenBEOPrintPage from "./pages/KitchenBEOPrintPage";
import SiteVisitPage from "./pages/SiteVisitPage";
import FeedbackIssuesPage from "./pages/FeedbackIssuesPage";

const InvoiceIntakePage = lazy(() => import("./pages/InvoiceIntakePage").then((m) => ({ default: m.default })));
import AdminPage from "./pages/AdminPage";
import EventOverviewPage from "./pages/EventOverviewPage";
import ClientQuestionnairePage from "./pages/ClientQuestionnairePage";
import FOHLeadOverview from "./pages/FOHLeadOverview";
import EarlyEventSections from "./pages/EarlyEventSections";

const DELIVERY_NAV = [
  { label: "Delivery Home", href: "/delivery-command", icon: "🚚" },
  { label: "Staff intake", href: "/delivery/intake", icon: "📝" },
  { label: "Dispatch", href: "/delivery-command/dispatch", icon: "📋" },
  { label: "Kitchen BEO", href: "/kitchen-beo-print", icon: "🍳" },
];

const OPS_CHIEF_NAV = [
  { label: "Ops Chief Home", href: "/ops-chief", icon: "🎯" },
  { label: "Alerts Dashboard", href: "/ops-chief/alerts", icon: "⚠️" },
  { label: "Flair", href: "/flair", icon: "🎪" },
  { label: "Intake", href: "/beo-intake", icon: "📋" },
  { label: "Kitchen", href: "/kitchen", icon: "🍳" },
  { label: "Deliveries", href: "/delivery-command", icon: "🚚" },
];

export const Router = ({ selectedEventId }: { selectedEventId: string | null }) => {
	const { pathname } = useLocation();

  return (
    <Routes>
      <Route path="/client-form/:eventId" element={<ClientQuestionnairePage />} />
      <Route path="/event/:id" element={<EventOverviewPage />} />
      <Route path="/lead/:id" element={<FOHLeadOverview />} />
      <Route
        path="/client/:clientId"
        element={
          <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
            <ClientOverviewPage />
          </Suspense>
        }
      />
      <Route path="*" element={<RouterContent pathname={pathname} selectedEventId={selectedEventId} />} />
    </Routes>
  );
};

function RouterContent({ pathname, selectedEventId }: { pathname: string; selectedEventId: string | null }) {
  if (pathname.startsWith("/invoice-intake")) {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <InvoiceIntakePage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/site-visit")) {
    return <SiteVisitPage />;
  }

  if (pathname.startsWith("/seed-demo")) {
    return <SeedDemoEventPage />;
  }

  if (pathname.startsWith("/print-test")) {
    return <PrintTestPage />;
  }

	if (pathname.startsWith("/quick-intake")) {
		return <Navigate to="/event/new" replace />;
	}

	if (pathname.startsWith("/early-event-sections")) {
		return <EarlyEventSections />;
	}

	if (pathname === "/" || pathname.startsWith("/home")) {
		return <DashboardPage />;
	}

	if (pathname.startsWith("/dashboard-old")) {
		return <HomeDashboard />;
	}

	if (pathname.startsWith("/beo-intake")) {
		return <BeoIntakePage />;
	}

  if (pathname === "/foh/leads/new") {
    return <LeadIntakePage />;
  }
  if (pathname.startsWith("/foh/leads")) {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <IntakeFOHLandingPage defaultView="leads" />
      </Suspense>
    );
  }
  if (pathname.startsWith("/foh")) {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <FOHLandingPage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/watchtower")) {
    return <Watchtower />;
  }

  if (pathname.startsWith("/ops-chief/alerts")) {
    return (
      <DepartmentLayout title="Ops Chief" navItems={OPS_CHIEF_NAV} departmentContext="ops_chief">
        <OpsChiefDashboard />
      </DepartmentLayout>
    );
  }

  if (pathname === "/ops-chief") {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <OpsChiefLandingPage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/intake-foh")) {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <IntakeFOHLandingPage defaultView="events" />
      </Suspense>
    );
  }

  if (pathname.startsWith("/spec-engine-test")) {
    return <SpecEngineTestPage />;
  }

  if (pathname.startsWith("/spec-engine/")) {
    return <SpecEngine />;
  }

  if (pathname.startsWith("/beo-print/")) {
    return <BeoPrintPage />;
  }

	if (pathname.startsWith("/papa-chulo")) {
		return <PapaChulo />;
	}

  if (pathname.startsWith("/profit/")) {
    return <Profit />;
  }

  if (pathname.startsWith("/health/")) {
    return <Health />;
  }

  const KITCHEN_NAV = [
    { label: "Kitchen Home", href: "/kitchen", icon: "🍳" },
    { label: "Kitchen Prep", href: "/kitchen-prep", icon: "📋" },
  ];

  const FLAIR_NAV = [
    { label: "Flair Home", href: "/flair", icon: "🎪" },
    { label: "Returned Equipment", href: "/returned-equipment", icon: "📦" },
    { label: "Full BEO Packet", href: "/beo-print", icon: "📄" },
  ];

  if (pathname === "/kitchen") {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <KitchenLandingPage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/kitchen-beo-print")) {
    return (
      <DepartmentLayout title="Kitchen" navItems={KITCHEN_NAV} departmentContext="kitchen">
        <KitchenBEOPrintPage />
      </DepartmentLayout>
    );
  }

  if (pathname.startsWith("/kitchen-prep")) {
    return (
      <DepartmentLayout title="Kitchen" navItems={KITCHEN_NAV} departmentContext="kitchen">
        <KitchenPrepPage />
      </DepartmentLayout>
    );
  }

  if (pathname === "/flair") {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <FlairLandingPage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/delivery-command/dispatch")) {
    return (
      <DepartmentLayout title="Deliveries / Expediting" navItems={DELIVERY_NAV} departmentContext="delivery">
        <DeliveryCommandPage />
      </DepartmentLayout>
    );
  }

  if (pathname === "/delivery-command") {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <DeliveryLandingPage />
      </Suspense>
    );
  }

  if (pathname === "/delivery/intake") {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: "#888" }}>Loading…</div>}>
        <DeliveryIntakeLandingPage />
      </Suspense>
    );
  }

  if (pathname.startsWith("/returned-equipment")) {
    return (
      <DepartmentLayout title="Flair / Equipment" navItems={FLAIR_NAV} departmentContext="flair">
        <ReturnedEquipmentPage />
      </DepartmentLayout>
    );
  }

  if (pathname.startsWith("/post-event-debrief")) {
    return <PostEventDebriefPage />;
  }

  if (pathname.startsWith("/feedback-issues")) {
    return <FeedbackIssuesPage />;
  }

  if (pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

	return <DashboardPage />;
};
