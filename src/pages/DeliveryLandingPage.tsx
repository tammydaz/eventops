import { DepartmentLayout } from "../components/DepartmentLayout";
import { EventsPipeline } from "../components/EventsPipeline";

const DELIVERY_NAV = [
  { label: "Delivery Home", href: "/delivery-command", icon: "🚚" },
  { label: "Staff intake", href: "/delivery/intake", icon: "📝" },
  { label: "Dispatch", href: "/delivery-command/dispatch", icon: "📋" },
  { label: "Kitchen BEO", href: "/kitchen-beo-print", icon: "🍳" },
];

export default function DeliveryLandingPage() {
  return (
    <DepartmentLayout title="Deliveries / Expediting" navItems={DELIVERY_NAV} departmentContext="delivery">
      <EventsPipeline title="Deliveries — Weekly Pipeline" departmentContext="delivery" />
    </DepartmentLayout>
  );
}
