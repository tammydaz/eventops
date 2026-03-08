import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const FLAIR_NAV = [
  { label: "Flair Home", href: "/flair", icon: "🎪" },
  { label: "Returned Equipment", href: "/returned-equipment", icon: "📦" },
  { label: "Full BEO Packet", href: "/beo-print", icon: "📄" },
];

export default function FlairLandingPage() {
  return (
    <DepartmentLayout title="Flair / Equipment" navItems={FLAIR_NAV}>
      <EventsPipeline title="Flair / Equipment — 10-Day Pipeline" departmentContext="flair" />
    </DepartmentLayout>
  );
}
