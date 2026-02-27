import { FormSection, CollapsibleSubsection } from "./FormSection";
import { MenuSection } from "./MenuSection";
import { BeverageServicesSection } from "./BeverageServicesSection";

export const MenuAndBeveragesSection = () => (
  <FormSection title="Menu & Beverages" icon="🍽️" dotColor="#22c55e">
    <MenuSection embedded />
    <CollapsibleSubsection title="Beverage Service" icon="🍹" defaultOpen>
      <BeverageServicesSection embedded />
    </CollapsibleSubsection>
  </FormSection>
);
