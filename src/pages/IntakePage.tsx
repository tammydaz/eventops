import { ClientSection } from "../components/intake/ClientSection";
import { EventDetailsSection } from "../components/intake/EventDetailsSection";
import { TimelineSection } from "../components/intake/TimelineSection";
import { MenuSection } from "../components/intake/MenuSection";
import { BarSection } from "../components/intake/BarSection";
import { HydrationSection } from "../components/intake/HydrationSection";
import { CoffeeSection } from "../components/intake/CoffeeSection";
import { RentalsSection } from "../components/intake/RentalsSection";
import { StaffSection } from "../components/intake/StaffSection";
import { NotesSection } from "../components/intake/NotesSection";
import { StatusSection } from "../components/intake/StatusSection";
import { AttachmentsSection } from "../components/intake/AttachmentsSection";
import { PrintBlocksSection } from "../components/intake/PrintBlocksSection";
import { ServicewarePanel } from "../components/intake/ServicewarePanel";

export const IntakePage = () => {
  return (
    <div className="mt-6">
      <div className="mb-4">
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 hover:border-red-600 transition"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      <EventDetailsSection />
      <ClientSection />
      <TimelineSection />
      <MenuSection />
      <BarSection />
      <HydrationSection />
      <CoffeeSection />
      <RentalsSection />
      <ServicewarePanel />
      <StaffSection />
      <NotesSection />
      <StatusSection />
      <AttachmentsSection />
      <PrintBlocksSection />
    </div>
  );
};
