import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const FLAIR_NAV = [
  { label: "Flair Home", href: "/flair", icon: "🎪" },
  { label: "Returned Equipment", href: "/returned-equipment", icon: "📦" },
  { label: "Full BEO Packet", href: "/beo-print", icon: "📄" },
];

export default function FlairLandingPage() {
  return (
    <DepartmentLayout title="Flair / Equipment" navItems={FLAIR_NAV} departmentContext="flair">
      <EventsPipeline title="Flair / Equipment — Weekly Pipeline" departmentContext="flair" />
    </DepartmentLayout>
  );
}
