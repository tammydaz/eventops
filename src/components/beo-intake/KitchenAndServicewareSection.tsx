import { FormSection, CollapsibleSubsection } from "./FormSection";
import { KitchenLogisticsSection } from "./KitchenLogisticsSection";
import { ServicewareSection } from "./ServicewareSection";

export const KitchenAndServicewareSection = () => (
  <FormSection title="Kitchen & Serviceware" icon="🔥" dotColor="#a855f7">
    <CollapsibleSubsection title="Kitchen & Hot Food Logic" icon="🔥" defaultOpen>
      <KitchenLogisticsSection embedded />
    </CollapsibleSubsection>
    <ServicewareSection embedded />
  </FormSection>
);
