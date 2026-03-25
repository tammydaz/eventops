import { FormSection, BEO_SECTION_PILL_ACCENT } from "./FormSection";
import { ServicewareSection } from "./ServicewareSection";

export const KitchenAndServicewareSection = () => (
  <FormSection title="Plates • Cutlery • Glassware" dotColor={BEO_SECTION_PILL_ACCENT} sectionId="beo-section-serviceware">
    <ServicewareSection embedded />
  </FormSection>
);
