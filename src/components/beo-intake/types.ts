/**
 * BEO Intake Type Definitions
 * Maps to Airtable Events table fields
 */

export type ClientDetails = {
  clientFirstName: string;
  clientLastName: string;
  clientBusinessName: string;
  clientEmail: string;
  clientPhone: string;
  clientStreet: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
};

export type PrimaryContact = {
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactRole: string;
};

export type EventCore = {
  eventType: string;
  eventOccasion: string;
  serviceStyle: string;
  eventDate: string;
  guestCount: number | null;
  dispatchTime: string;
  eventStartTime: string;
  eventEndTime: string;
  eventArrivalTime: string;
  opsExceptions: string;
};

export type VenueDetails = {
  venue: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueFullAddress: string;
};

export type Timeline = {
  dispatchTime: string;
  eventStartTime: string;
  eventEndTime: string;
  foodwerxArrival: string;
  opsExceptions: string;
};

export type TimelineFields = {
  dispatchTime: string;
  eventStartTime: string;
  eventEndTime: string;
  eventArrivalTime: string;
  opsExceptions: string;
};

export type BarService = {
  barServiceNeeded: string;
  signatureDrink: string;
  signatureDrinkName: string;
  signatureDrinkRecipe: string;
  whoSupplyingSignatureDrink: string;
  signatureDrinkMixers: string;
  signatureDrinkGarnishes: string;
};

export type HydrationStation = {
  infusedWater: string;
  infusionIngredients: string;
  dispenserCount: number | null;
  bottledWater: string;
  unsweetTea: string;
  sweetTea: string;
  sodaSelection: string;
  other: string;
};

export type CoffeeTea = {
  coffeeServiceNeeded: string;
};

export type Serviceware = {
  serviceWare: string;
  serviceWareSource: string;
  chinaPaperGlassware: string;
};

export type DietaryNotes = {
  dietaryNotes: string;
  specialNotes: string;
};

export type DesignerNotes = {
  themeColorScheme: string;
};

export type Logistics = {
  parkingAccess: string;
  parkingNotes: string;
};
