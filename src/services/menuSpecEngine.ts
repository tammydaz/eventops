export type SpecEngineInput = {
  guestCount: number;
  menuItems: MenuItem[];
  serviceStyle: string;
  eventType: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: "passed" | "buffet" | "plated" | "stationed" | "dessert";
  servingSize?: number;
  tierOverride?: number;
};

export type SpecEngineOutput = {
  items: MenuItemSpec[];
  equipment: EquipmentSpec;
  confidence: number;
  metadata: SpecMetadata;
};

export type MenuItemSpec = {
  itemId: string;
  itemName: string;
  category: string;
  tier: number;
  portionsPer100: number;
  totalPortions: number;
  halfPanCount: number;
  chaferCount: number;
  confidence: number;
};

export type EquipmentSpec = {
  chafersTotal: number;
  halfPansTotal: number;
  fullPansTotal: number;
  roundChafersTotal: number;
};

export type SpecMetadata = {
  guestCount: number;
  serviceStyle: string;
  eventType: string;
  generatedAt: string;
  engineVersion: string;
};

const TIER_BASE_PORTIONS = {
  1: 125,
  2: 100,
  3: 75,
  4: 50,
  5: 25,
};

const REDUNDANCY_SHIFT = {
  passed: 1.15,
  buffet: 1.10,
  plated: 1.0,
  stationed: 1.08,
  dessert: 1.12,
};

const CHAFER_CAPACITY = {
  halfPan: 25,
  fullPan: 50,
  round: 35,
};

function GET_BASE_TIER(category: string, eventType: string): number {
  if (category === "passed") {
    return eventType === "wedding" ? 2 : 3;
  }
  if (category === "buffet") {
    return eventType === "corporate" ? 3 : 2;
  }
  if (category === "plated") {
    return 1;
  }
  if (category === "stationed") {
    return 3;
  }
  if (category === "dessert") {
    return 4;
  }
  return 3;
}

function APPLY_REDUNDANCY_SHIFT(basePortions: number, category: string): number {
  const shift = REDUNDANCY_SHIFT[category as keyof typeof REDUNDANCY_SHIFT] || 1.0;
  return Math.ceil(basePortions * shift);
}

function GET_BUFFET_PAN_COUNT(totalPortions: number, category: string): number {
  if (category === "plated") return 0;
  
  const portionsPerHalfPan = CHAFER_CAPACITY.halfPan;
  const rawPanCount = totalPortions / portionsPerHalfPan;
  
  return Math.ceil(rawPanCount);
}

function GET_PASSED_COUNT(totalPortions: number, guestCount: number): number {
  if (guestCount === 0) return 0;
  return Math.ceil(totalPortions / guestCount);
}

function CALCULATE_CHAFER_COUNT(halfPanCount: number): number {
  return Math.ceil(halfPanCount / 2);
}

function CALCULATE_CONFIDENCE(
  tier: number,
  category: string,
  guestCount: number
): number {
  let confidence = 85;
  
  if (tier === 1) confidence += 10;
  if (tier === 2) confidence += 5;
  if (tier >= 4) confidence -= 5;
  
  if (category === "plated") confidence += 10;
  if (category === "passed" && guestCount > 200) confidence -= 5;
  
  if (guestCount < 20) confidence -= 10;
  if (guestCount > 500) confidence -= 5;
  
  return Math.max(50, Math.min(100, confidence));
}

function CALCULATE_PORTIONS_PER_100(tier: number, category: string): number {
  const basePortion = TIER_BASE_PORTIONS[tier as keyof typeof TIER_BASE_PORTIONS] || 75;
  const adjusted = APPLY_REDUNDANCY_SHIFT(basePortion, category);
  return adjusted;
}

function CALCULATE_TOTAL_PORTIONS(
  portionsPer100: number,
  guestCount: number
): number {
  return Math.ceil((portionsPer100 * guestCount) / 100);
}

function PROCESS_MENU_ITEM(
  item: MenuItem,
  guestCount: number,
  eventType: string
): MenuItemSpec {
  const tier = item.tierOverride || GET_BASE_TIER(item.category, eventType);
  const portionsPer100 = CALCULATE_PORTIONS_PER_100(tier, item.category);
  const totalPortions = CALCULATE_TOTAL_PORTIONS(portionsPer100, guestCount);
  const halfPanCount = GET_BUFFET_PAN_COUNT(totalPortions, item.category);
  const chaferCount = CALCULATE_CHAFER_COUNT(halfPanCount);
  const confidence = CALCULATE_CONFIDENCE(tier, item.category, guestCount);
  
  return {
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    tier,
    portionsPer100,
    totalPortions,
    halfPanCount,
    chaferCount,
    confidence,
  };
}

function CALCULATE_EQUIPMENT(specs: MenuItemSpec[]): EquipmentSpec {
  const chafersTotal = specs.reduce((sum, spec) => sum + spec.chaferCount, 0);
  const halfPansTotal = specs.reduce((sum, spec) => sum + spec.halfPanCount, 0);
  const fullPansTotal = Math.floor(halfPansTotal / 2);
  const roundChafersTotal = Math.ceil(chafersTotal * 0.15);
  
  return {
    chafersTotal,
    halfPansTotal,
    fullPansTotal,
    roundChafersTotal,
  };
}

function CALCULATE_OVERALL_CONFIDENCE(specs: MenuItemSpec[]): number {
  if (specs.length === 0) return 0;
  
  const avgConfidence = specs.reduce((sum, spec) => sum + spec.confidence, 0) / specs.length;
  return Math.round(avgConfidence);
}

export function MenuSpecEngine(input: SpecEngineInput): SpecEngineOutput {
  const specs = input.menuItems.map((item) =>
    PROCESS_MENU_ITEM(item, input.guestCount, input.eventType)
  );
  
  const equipment = CALCULATE_EQUIPMENT(specs);
  const confidence = CALCULATE_OVERALL_CONFIDENCE(specs);
  
  const metadata: SpecMetadata = {
    guestCount: input.guestCount,
    serviceStyle: input.serviceStyle,
    eventType: input.eventType,
    generatedAt: new Date().toISOString(),
    engineVersion: "1.0.0",
  };
  
  return {
    items: specs,
    equipment,
    confidence,
    metadata,
  };
}
