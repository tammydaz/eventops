import { FormSection, CollapsibleSubsection } from "./FormSection";
import { MenuSection } from "./MenuSection";
import { BeverageServicesSection } from "./BeverageServicesSection";
import { DeliveryPaperProductsSection } from "./DeliveryPaperProductsSection";

export const MenuAndBeveragesSection = ({ isDelivery = false }: { isDelivery?: boolean }) => (
  <FormSection title="Menu & Beverages" icon="🍽️" dotColor={isDelivery ? "#22c55e" : "#ff6b6b"} isDelivery={isDelivery} defaultOpen>
    <MenuSection embedded isDelivery={isDelivery} />
    <CollapsibleSubsection title="Beverage Service" icon="🍹" defaultOpen={true} isDelivery={isDelivery}>
      <BeverageServicesSection embedded />
    </CollapsibleSubsection>
    {isDelivery && (
      <CollapsibleSubsection title="Paper Products & Utensils" icon="📦" defaultOpen isDelivery={isDelivery}>
        <DeliveryPaperProductsSection embedded />
      </CollapsibleSubsection>
    )}
  </FormSection>
);
