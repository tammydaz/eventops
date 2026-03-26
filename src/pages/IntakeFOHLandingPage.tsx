import { useLocation } from "react-router-dom";
import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";
import LeadsLandingPage from "./LeadsLandingPage";

export type FOHViewMode = "leads" | "events";

const INTAKE_FOH_NAV = [
  { label: "Add Event", href: "/event/new" },
  { label: "Event Overview", href: "/intake-foh" },
  { label: "Open BEO Intake", href: "/beo-intake" },
  { label: "Leads", href: "/foh/leads" },
];

type IntakeFOHLandingPageProps = {
  defaultView?: FOHViewMode;
};

export default function IntakeFOHLandingPage({ defaultView = "events" }: IntakeFOHLandingPageProps) {
  const { pathname } = useLocation();
  const isLeadsRoute = pathname.startsWith("/foh/leads");

  return (
    <DepartmentLayout
      title="Intake / FOH"
      navItems={INTAKE_FOH_NAV}
      departmentContext="intake_foh"
      hideSidebar
    >
      {isLeadsRoute ? (
        <LeadsLandingPage />
      ) : (
        <EventsPipeline departmentContext="intake_foh" />
      )}
    </DepartmentLayout>
  );
}
