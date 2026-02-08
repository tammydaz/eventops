import { IntakePage } from "./pages/IntakePage";
import { PrintTest } from "./pages/PrintTest";
import { HomeDashboard } from "./pages/HomeDashboard";
import { QuickIntake } from "./pages/QuickIntake";
import DashboardPage from "./pages/DashboardPage";
import FOHLandingPage from "./pages/FOHLandingPage";
import Watchtower from "./pages/Watchtower";
import SpecEngine from "./pages/spec-engine";
import BeoPrint from "./pages/beo-print";
import Profit from "./pages/profit";
import Health from "./pages/health";
import PapaChulo from "./pages/PapaChulo";

export const Router = ({ selectedEventId }: { selectedEventId: string | null }) => {
	const pathname = window.location.pathname;

	if (pathname.startsWith("/print-test")) {
		return <PrintTest />;
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
		if (!selectedEventId) return null;
		return <IntakePage />;
	}

  if (pathname.startsWith("/foh")) {
    return <FOHLandingPage />;
  }

  if (pathname.startsWith("/watchtower")) {
    return <Watchtower />;
  }

  if (pathname.startsWith("/spec-engine/")) {
    return <SpecEngine />;
  }

  if (pathname.startsWith("/beo-print/")) {
    return <BeoPrint />;
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

	return <DashboardPage />;
};
