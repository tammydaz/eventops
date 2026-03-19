import { FormSection, CollapsibleSubsection } from "./FormSection";
import { MenuSection } from "./MenuSection";
import { DeliveryPaperProductsSection } from "./DeliveryPaperProductsSection";

export const MenuAndBeveragesSection = ({ isDelivery = false }: { isDelivery?: boolean }) => (
  <FormSection
    title="Menu"
    subtitle={!isDelivery ? "Passed · Presented · Deli · Buffet · Desserts · Stations" : undefined}
    dotColor={isDelivery ? "#22c55e" : undefined}
    isDelivery={isDelivery}
    defaultOpen={false}
    sectionId="beo-section-menu"
    titleAlign="center"
  >
    <MenuSection embedded isDelivery={isDelivery} />
    {isDelivery && (
      <CollapsibleSubsection title="Paper Products & Utensils" defaultOpen={false} isDelivery={isDelivery}>
        <DeliveryPaperProductsSection embedded />
      </CollapsibleSubsection>
    )}
  </FormSection>
);
