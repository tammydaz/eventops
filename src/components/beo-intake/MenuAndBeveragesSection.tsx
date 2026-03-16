import { FormSection, CollapsibleSubsection } from "./FormSection";
import { MenuSection } from "./MenuSection";
import { BeverageServicesSection } from "./BeverageServicesSection";
import { DeliveryPaperProductsSection } from "./DeliveryPaperProductsSection";

export const MenuAndBeveragesSection = ({ isDelivery = false }: { isDelivery?: boolean }) => (
  <FormSection title="Menu & Beverages" dotColor={isDelivery ? "#22c55e" : undefined} isDelivery={isDelivery} defaultOpen={false} sectionId="beo-section-menu">
    <MenuSection embedded isDelivery={isDelivery} />
    <CollapsibleSubsection title="Beverage Service" defaultOpen={false} isDelivery={isDelivery}>
      <BeverageServicesSection embedded />
    </CollapsibleSubsection>
    {isDelivery && (
      <CollapsibleSubsection title="Paper Products & Utensils" defaultOpen={false} isDelivery={isDelivery}>
        <DeliveryPaperProductsSection embedded />
      </CollapsibleSubsection>
    )}
  </FormSection>
);
