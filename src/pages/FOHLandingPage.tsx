import { Link } from "react-router-dom";
import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const FOH_NAV = [
  { label: "Add Event", href: "/event/new" },
  { label: "Event Builder", href: "/beo-intake" },
  { label: "Leads", href: "/foh/leads" },
  { label: "Events", href: "/intake-foh" },
];

const headerActions = (
  <>
    <Link
      to="/invoice-intake"
      className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300"
      style={{
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.4)",
        color: "#4ade80",
        textDecoration: "none",
      }}
    >
      📄 Upload Invoice
    </Link>
  </>
);

export default function FOHLandingPage() {
  return (
    <DepartmentLayout
      title="FOH"
      navItems={FOH_NAV}
      departmentContext="intake_foh"
      headerActions={headerActions}
    >
      <EventsPipeline title="FOH — Weekly Pipeline" departmentContext="intake_foh" />
    </DepartmentLayout>
  );
}
