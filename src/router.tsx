import { BeoIntakePage } from "./pages/BeoIntakePage";
import PrintTestPage from "./pages/PrintTestPage";
import { HomeDashboard } from "./pages/HomeDashboard";
import { QuickIntake } from "./pages/QuickIntake";
import DashboardPage from "./pages/DashboardPage";
import FOHLandingPage from "./pages/FOHLandingPage";
import Watchtower from "./pages/Watchtower";
import SpecEngine from "./pages/spec-engine";
import BeoPrintPage from "./pages/BeoPrintPage";
import Profit from "./pages/profit";
import Health from "./pages/health";
import PapaChulo from "./pages/PapaChulo";
import OpsChiefDashboard from "./pages/OpsChiefDashboard";
import KitchenPrepPage from "./pages/KitchenPrepPage";
import DeliveryCommandPage from "./pages/DeliveryCommandPage";
import ReturnedEquipmentPage from "./pages/ReturnedEquipmentPage";
import PostEventDebriefPage from "./pages/PostEventDebriefPage";

export const Router = ({ selectedEventId }: { selectedEventId: string | null }) => {
	const pathname = window.location.pathname;

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

  if (pathname.startsWith("/ops-chief")) {
    return <OpsChiefDashboard />;
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

  if (pathname.startsWith("/kitchen-prep")) {
    return <KitchenPrepPage />;
  }

  if (pathname.startsWith("/delivery-command")) {
    return <DeliveryCommandPage />;
  }

  if (pathname.startsWith("/returned-equipment")) {
    return <ReturnedEquipmentPage />;
  }

  if (pathname.startsWith("/post-event-debrief")) {
    return <PostEventDebriefPage />;
  }

	return <DashboardPage />;
};
