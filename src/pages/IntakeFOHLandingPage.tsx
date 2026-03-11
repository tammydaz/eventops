import { useLocation } from "react-router-dom";
import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";
import LeadsLandingPage from "./LeadsLandingPage";

export type FOHViewMode = "leads" | "events";

const INTAKE_FOH_NAV = [
  { label: "Add Event", href: "/quick-intake" },
  { label: "Open Event", href: "/beo-intake" },
  { label: "Leads", href: "/foh/leads" },
  { label: "Events", href: "/intake-foh" },
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
    >
      {isLeadsRoute ? (
        <LeadsLandingPage />
      ) : (
        <EventsPipeline title="Intake/FOH — 10-Day Pipeline" departmentContext="intake_foh" />
      )}
    </DepartmentLayout>
  );
}
