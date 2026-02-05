import { IntakePage } from "./pages/IntakePage";
import { PrintTest } from "./pages/PrintTest";
import { HomeDashboard } from "./pages/HomeDashboard";
import { QuickIntake } from "./pages/QuickIntake";

export const Router = ({ selectedEventId }: { selectedEventId: string | null }) => {
	const pathname = window.location.pathname;

	if (pathname.startsWith("/print-test")) {
		return <PrintTest />;
	}

	if (pathname.startsWith("/quick-intake")) {
		return <QuickIntake />;
	}

	if (pathname === "/" || pathname.startsWith("/home")) {
		return <HomeDashboard />;
	}

	if (pathname.startsWith("/beo-intake")) {
		if (!selectedEventId) return null;
		return <IntakePage />;
	}

	return <HomeDashboard />;
};
