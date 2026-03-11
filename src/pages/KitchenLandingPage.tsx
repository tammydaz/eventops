import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const KITCHEN_NAV = [
  { label: "Kitchen Home", href: "/kitchen", icon: "🍳" },
  { label: "Kitchen Prep", href: "/kitchen-prep", icon: "📋" },
];

export default function KitchenLandingPage() {
  return (
    <DepartmentLayout title="Kitchen" navItems={KITCHEN_NAV} departmentContext="kitchen">
      <EventsPipeline title="Kitchen — 10-Day Pipeline" departmentContext="kitchen" />
    </DepartmentLayout>
  );
}
