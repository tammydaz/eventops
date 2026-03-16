import { FormSection } from "./FormSection";
import { ServicewareSection } from "./ServicewareSection";

export const KitchenAndServicewareSection = () => (
  <FormSection title="Plates • Cutlery • Glassware" dotColor="#00bcd4" sectionId="beo-section-serviceware">
    <ServicewareSection embedded />
  </FormSection>
);
