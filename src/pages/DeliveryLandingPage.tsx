import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const DELIVERY_NAV = [
  { label: "Delivery Home", href: "/delivery-command", icon: "🚚" },
  { label: "Dispatch", href: "/delivery-command/dispatch", icon: "📋" },
  { label: "Kitchen BEO", href: "/kitchen-beo-print", icon: "🍳" },
];

export default function DeliveryLandingPage() {
  return (
    <DepartmentLayout title="Deliveries / Expediting" navItems={DELIVERY_NAV} departmentContext="delivery">
      <EventsPipeline title="Deliveries — 10-Day Pipeline" departmentContext="delivery" />
    </DepartmentLayout>
  );
}
