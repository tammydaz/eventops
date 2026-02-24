export interface SpecParams {
  itemId: string;
  itemName: string;
  section: string;
  guestCount: number;
  nickQtyOverride?: string;
}

const TIER_BANDS = [
  { max: 40, protein: '1 full', side: '1 full', sauce: '1 qt' },
  { max: 75, protein: '1 full', side: '1 full', sauce: '1-2 qt' },
  { max: 125, protein: '2 full', side: '1-2 full', sauce: '2 qt' },
  { max: 175, protein: '2-3 full', side: '2 full', sauce: '2-3 qt' },
  { max: 225, protein: '3 full', side: '2-3 full', sauce: '3 qt' },
  { max: 300, protein: '3-4 full', side: '3 full', sauce: '3-4 qt' },
];

export function calculateSpec(params: SpecParams): string {
  // Rule 1: Nick override always wins
  if (params.nickQtyOverride) {
    return params.nickQtyOverride;
  }

  // Rule 2: Route by section
  if (params.section.includes('PASSED')) {
    return calculatePassedAppSpec(params);
  }

  if (params.section.includes('PRESENTED')) {
    return calculatePresentedAppSpec(params);
  }

  if (params.section.includes('BUFFET')) {
    return calculateBuffetSpec(params);
  }

  if (params.section === 'DESSERTS') {
    return calculateDessertSpec(params);
  }

  if (params.section === 'STATIONS') {
    return calculateStationSpec(params);
  }

  return '—';
}

function detectVessel(itemName: string): string {
  const lowerName = itemName.toLowerCase();

  // Bowls (salads, slaws)
  if (['salad', 'slaw', 'mix', 'greens'].some(k => lowerName.includes(k))) {
    return 'bowl';
  }

  // Platters (displays, charcuterie)
  if (['cheese display', 'cheese platter', 'charcuterie', 'crudité', 'display'].some(k => lowerName.includes(k))) {
    return 'platter';
  }

  // Round chafers (mashed potatoes, soups)
  if (['mashed potato', 'mashed', 'soup', 'chowder', 'bisque', 'risotto'].some(k => lowerName.includes(k))) {
    return ' (round chafer)';
  }

  return 'pan'; // default
}

function calculatePassedAppSpec(params: SpecParams): string {
  const totalPieces = params.guestCount * 5; // 5 pieces per guest
  const roundedToDozen = Math.ceil(totalPieces / 12) * 12;
  return `${roundedToDozen} pc`;
}

function calculatePresentedAppSpec(params: SpecParams): string {
  if (params.guestCount < 75) return '1 full';
  if (params.guestCount <= 100) return '1-2 full';
  return '2 full';
}

function calculateBuffetSpec(params: SpecParams): string {
  const band = TIER_BANDS.find(b => params.guestCount <= b.max) || TIER_BANDS[TIER_BANDS.length - 1];

  // Sauces
  if (isSauce(params.itemName)) {
    return band.sauce;
  }

  // Detect vessel
  const vessel = detectVessel(params.itemName);
  const baseSpec = band.side;

  return `${baseSpec} ${vessel}`;
}

function calculateDessertSpec(params: SpecParams): string {
  return calculateBuffetSpec(params); // Same logic as buffet
}

function calculateStationSpec(params: SpecParams): string {
  return calculateBuffetSpec(params); // Same logic as buffet
}

function isSauce(itemName: string): boolean {
  const lowerName = itemName.toLowerCase();
  return ['sauce', 'dressing', 'aioli', 'vinaigrette', 'reduction', 'cream'].some(k => lowerName.includes(k));
}
