import { useLocation } from "react-router-dom";
import { BeoIntakePage } from "./pages/BeoIntakePage";
import { SeedDemoEventPage } from "./pages/SeedDemoEventPage";
import PrintTestPage from "./pages/PrintTestPage";
import { HomeDashboard } from "./pages/HomeDashboard";
import { QuickIntake } from "./pages/QuickIntake";
import DashboardPage from "./pages/DashboardPage";
import FOHLandingPage from "./pages/FOHLandingPage";
import Watchtower from "./pages/Watchtower";
import SpecEngine from "./pages/spec-engine";
import SpecEngineTestPage from "./pages/SpecEngineTestPage";
import BeoPrintPage from "./pages/BeoPrintPage";
import Profit from "./pages/profit";
import Health from "./pages/health";
import PapaChulo from "./pages/PapaChulo";
import OpsChiefDashboard from "./pages/OpsChiefDashboard";
import KitchenPrepPage from "./pages/KitchenPrepPage";
import KitchenLandingPage from "./pages/KitchenLandingPage";
import FlairLandingPage from "./pages/FlairLandingPage";
import DeliveryCommandPage from "./pages/DeliveryCommandPage";
import DeliveryLandingPage from "./pages/DeliveryLandingPage";
import OpsChiefLandingPage from "./pages/OpsChiefLandingPage";
import IntakeFOHLandingPage from "./pages/IntakeFOHLandingPage";
import ReturnedEquipmentPage from "./pages/ReturnedEquipmentPage";
import { DepartmentLayout } from "./components/DepartmentLayout";
import PostEventDebriefPage from "./pages/PostEventDebriefPage";
import KitchenBEOPrintPage from "./pages/KitchenBEOPrintPage";
import SiteVisitPage from "./pages/SiteVisitPage";
import InvoiceIntakePage from "./pages/InvoiceIntakePage";
import FeedbackIssuesPage from "./pages/FeedbackIssuesPage";
import AdminPage from "./pages/AdminPage";

const DELIVERY_NAV = [
  { label: "Delivery Home", href: "/delivery-command", icon: "🚚" },
  { label: "Dispatch", href: "/delivery-command/dispatch", icon: "📋" },
];

const OPS_CHIEF_NAV = [
  { label: "Ops Chief Home", href: "/ops-chief", icon: "🎯" },
  { label: "Alerts Dashboard", href: "/ops-chief/alerts", icon: "⚠️" },
];

export const Router = ({ selectedEventId }: { selectedEventId: string | null }) => {
	const { pathname } = useLocation();

  if (pathname.startsWith("/invoice-intake")) {
    return <InvoiceIntakePage />;
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
		return <QuickIntake />;
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

  if (pathname.startsWith("/foh")) {
    return <FOHLandingPage />;
  }

  if (pathname.startsWith("/watchtower")) {
    return <Watchtower />;
  }

  if (pathname.startsWith("/ops-chief/alerts")) {
    return (
      <DepartmentLayout title="Ops Chief" navItems={OPS_CHIEF_NAV}>
        <OpsChiefDashboard />
      </DepartmentLayout>
    );
  }

  if (pathname === "/ops-chief") {
    return <OpsChiefLandingPage />;
  }

  if (pathname.startsWith("/intake-foh")) {
    return <IntakeFOHLandingPage />;
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
    return <KitchenLandingPage />;
  }

  if (pathname.startsWith("/kitchen-beo-print")) {
    return (
      <DepartmentLayout title="Kitchen" navItems={KITCHEN_NAV}>
        <KitchenBEOPrintPage />
      </DepartmentLayout>
    );
  }

  if (pathname.startsWith("/kitchen-prep")) {
    return (
      <DepartmentLayout title="Kitchen" navItems={KITCHEN_NAV}>
        <KitchenPrepPage />
      </DepartmentLayout>
    );
  }

  if (pathname === "/flair") {
    return <FlairLandingPage />;
  }

  if (pathname.startsWith("/delivery-command/dispatch")) {
    return (
      <DepartmentLayout title="Deliveries / Expediting" navItems={DELIVERY_NAV}>
        <DeliveryCommandPage />
      </DepartmentLayout>
    );
  }

  if (pathname === "/delivery-command") {
    return <DeliveryLandingPage />;
  }

  if (pathname.startsWith("/returned-equipment")) {
    return (
      <DepartmentLayout title="Flair / Equipment" navItems={FLAIR_NAV}>
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
