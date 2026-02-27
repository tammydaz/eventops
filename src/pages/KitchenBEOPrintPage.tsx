import React, { useState, useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";
import { asString, asSingleSelectName, asBoolean, asStringArray } from "../services/airtable/selectors";
import { calculateSpec } from "../services/airtable/specEngine";
import { EventSelector } from "../components/EventSelector";
import { secondsTo12HourString } from "../utils/timeHelpers";

// ── Types ──
type SubItem = {
  text: string;
  color?: "red" | "blue" | "black";
};

type MenuItem = {
  qty: string;
  name: string;
  subItems?: SubItem[];
  customSpec?: string;
  breadVessel?: string;
  groupHeader?: string;
  isCallout?: boolean;
};

type MenuSection = {
  title: string;
  vessel: string;
  items: MenuItem[];
};

type TimelineEntry = {
  time: string;
  actions: string[];
};

type PaperProduct = {
  qty: string;
  item: string;
};

type BeverageItem = {
  qty: string;
  item: string;
};

type ServicewareRow = {
  clientSide: string;
  foodwerxSide: string;
};

type BEOData = {
  serviceType: "full-service" | "delivery";
  client: string;
  contact: string;
  phone: string;
  address: string;
  cityState: string;
  orderNumber: string;
  eventDate: string;
  guestCount: string;
  eventStart?: string;
  eventEnd?: string;
  fwStaff?: string;
  staffArrival?: string;
  invoice?: string;
  rentals?: string;
  updatedBy?: string;
  updatedDate?: string;
  deliveryTime?: string;
  deliveryNotes?: string;
  employee?: string;
  specialNotes?: string;
  allergyBanner?: string;
  kitchenBanner?: string;
  noKitchenOnSite?: boolean;
  isBuffet?: boolean;
  sections: MenuSection[];
  eventOccasion?: string;
  beveragesClient?: string[];
  beveragesFoodwerx?: string[];
  serviceware?: ServicewareRow[];
  notes?: string[];
  timeline?: TimelineEntry[];
  paperProducts?: PaperProduct[];
  paperProductsIncluded?: boolean;
  deliveryBeverages?: BeverageItem[];
  deliveryBeveragesIncluded?: boolean;
};

// ── Helper: expand parent + linked Child Items into rows (parent first, each child on own line) ──
const expandItemToRows = (
  parentName: string,
  childIds: string[],
  menuItemData: Record<string, { name: string; childIds: string[] }>
): { lineName: string; isChild: boolean }[] => {
  const rows: { lineName: string; isChild: boolean }[] = [{ lineName: parentName, isChild: false }];
  childIds.forEach((childId) => {
    const childName = menuItemData[childId]?.name || "Loading...";
    rows.push({ lineName: "  " + childName, isChild: true });
  });
  return rows;
};

const getVesselForSection = (title: string, isDelivery = false): string => {
  if (isDelivery) return "DISPOSABLE";
  if (title.includes("PASSED")) return "PASSED";
  if (title.includes("PRESENTED")) return "METAL/CHINA";
  if (title.includes("BUFFET")) return title.includes("METAL") ? "METAL" : "CHINA";
  if (title.includes("DESSERT")) return "DESSERT";
  if (title.includes("STATION")) return "STATION";
  if (title.includes("ROOM TEMP")) return "DISPOSABLE";
  return "METAL/CHINA";
};

// ── Sample Data — Full Service BEO ──
const FULL_SERVICE_SAMPLE: BEOData = {
  serviceType: "full-service",
  client: "Nicole Kowalczyk",
  contact: "",
  phone: "585-813-2245",
  address: "160 Old Croton Rd",
  cityState: "Flemington, NJ 08822",
  orderNumber: "102525-4",
  eventDate: "Saturday, October 25, 2025",
  guestCount: "40",
  eventStart: "12PM",
  eventEnd: "4:00PM",
  fwStaff: "NIKKI F",
  staffArrival: "10:30AM",
  invoice: "87468",
  rentals: "CLIENT",
  updatedBy: "JM",
  updatedDate: "10/22/2025",
  allergyBanner: undefined,
  noKitchenOnSite: true,
  isBuffet: false,
  kitchenBanner: "NO KITCHEN ON SITE — ALL FOOD MUST GO HOT",
  sections: [
    {
      title: "PRESENTED APPS",
      vessel: "METAL/CHINA",
      items: [
        { qty: "", name: "", groupHeader: "Mezze Display", subItems: [] },
        { qty: "30", name: "Falafel" },
        { qty: "30", name: "Spanakopita" },
        { qty: "24", name: "Stuffed Grape Leaves" },
        { qty: "30", name: "Greek Crostini w/ Whipped Feta, Sundried Tomatoes, Yellow Peppers & Mint" },
        { qty: "34", name: "Manicured Vegetables Shooters" },
        { qty: "2 QT", name: "Kalamative Olives Couscous" },
        { qty: "QT + QT + QT", name: "Charred Eggplant Baba Ghanoush + Hummus + Tzatziki" },
        { qty: "6x8", name: "Toasted Pita" },
        { qty: "55", name: "Traditional Shrimp Cocktail in Mini Shooter", subItems: [{ text: "w/ Cocktail Sauce" }] },
        { qty: "65", name: "Mini Beef Wellington", subItems: [{ text: "w/ Horeradish Crème" }] },
        { qty: "65", name: "Fig and Goat Cheese Crostini w/ Dried Cranberries & Toasted Almonds" },
        { qty: "40", name: "Thai Sesame Noodles w/ Chopsticks in Mini Chinese Take-Out Boxes" },
      ],
    },
    {
      title: "BUFFET",
      vessel: "METAL",
      items: [
        { qty: "", name: "", groupHeader: "Assorted Quiche", subItems: [] },
        { qty: "2", name: "Quiche Lorraine" },
        { qty: "1", name: "Country Ham & Cheddar" },
        { qty: "1", name: "Very Vegetarian" },
        {
          qty: "HOTEL + 1/2", name: "French Toast Casserole",
          customSpec: "PLEASE SCORE!!",
          subItems: [{ text: "w/ Maple Syrup" }],
        },
        {
          qty: "HOTEL PKD", name: "Chicken & Waffles",
          subItems: [
            { text: "w/ Maple Burbon Butter Syrup" },
            { text: "w/ Powdered Sugar" },
          ],
        },
      ],
    },
    {
      title: "BUFFET",
      vessel: "CHINA",
      items: [
        { qty: "", name: "", groupHeader: "Petite Cut Gourmet Sandwiches", subItems: [] },
        {
          qty: "18", name: "Charcuterie Sandwich - Honey-Goat Cheese Spread, Fig Jam, Olive Tapenade, Arugula, Thinly Sliced Prosciutto and Salami",
          breadVessel: "PETITE CROISSANT",
        },
        {
          qty: "18", name: "Smoked Turkey - Thinly Sliced Green Apples, Toasted Walnuts, Brie, Green Leaf Lettuce, & Cranberry Orange Relish",
          breadVessel: "SEMOLINA DINNER ROLL",
        },
        {
          qty: "3x12", name: "Savory & Sweet Flank Steak - w/ Brie, Caramelized Onion, Arugula & Fig Jam",
          breadVessel: "RAISIN BAGUETTE",
        },
        {
          qty: "18", name: "Chicken Salad - w/ Celery, Walnuts & Dried Cranberries",
          breadVessel: "ON CROISSANT",
        },
        {
          qty: "2x8", name: "Prosciutto de Parma - Buffalo Mozzarella w/ Roasted Peppers Roma Tomato, Arugula, Cracked Pepper Basil Leaves w/ Olive Oil Balsamic Drizzle",
          breadVessel: "LONG SEEDED ROLL",
        },
        { qty: "8# BOWL", name: "Bruschetta Tortellini Pasta Salad" },
        {
          qty: "DISPLAY PLATTER", name: "Wedge Salad - Crispy Lettuce, Vine Riped Tomatoes, Crispy Bacon, Hard Boiled Egg & Gorgonazola",
          subItems: [
            { text: "w/ Crispy Onion Straws" },
            { text: "w/ Bleu Cheese Dressing On Side" },
          ],
        },
      ],
    },
    {
      title: "DESSERTS",
      vessel: "CHINA",
      items: [
        {
          qty: "50", name: "Assorted Stuffed Beignets",
          customSpec: "SKEWER AND PUT ATOP SHOOTER",
          subItems: [
            { text: "w/ Chocolate Shooter" },
            { text: "w/ Caramel Shooter" },
          ],
        },
        { qty: "55", name: "Fruit & Berry Kabobs" },
      ],
    },
  ],
  beveragesClient: [],
  beveragesFoodwerx: [],
  serviceware: [
    { clientSide: "IN HOUSE", foodwerxSide: "" },
    { clientSide: "BACK UP ONLY", foodwerxSide: "BIG & SMALL PLASTIC CUPS" },
    { clientSide: "BACK UP ONLY", foodwerxSide: "COCKTAIL NAPKINS" },
  ],
  notes: [
    "BABY SHOWER (SHE'S HAVING A GIRL)",
    "BRIDGERTON THEME TEA PARTY",
    "LOTS OF PRETTY DISPLAYS - CLIENT WILL HAVE SOME DÉCOR AS WELL",
    "MAIN COLOR LIGHT BLUE - TOUCHES OF PASTEL PINKS AND PURPLES",
    "UNLOAD & PARK PULL IN BEFORE THE GATE & ENTER THROUGH THE FRONT DOOR",
    "KITCHEN ACCESS / STORAGE ACCESS: YES 2ND FRIDGE IN GARAGE FOR THE LEFTOVERS",
    "FOOD DISPLAYED IN DINING ROOM AND KITCHEN ISLAND - DESSERT TABLE IN FAR SIDE SUNROOM",
    "CLIENT TO PROVIDE CAKE AND OTHER DESSERTS - BRING CAKE KNIFE TO CUT AND SERVE",
    "TRASH TO BE TAKEN TO OUTSIDE TRASHCAN BY GARAGE",
  ],
  timeline: [
    { time: "10:30AM", actions: ["STAFF ARRIVAL", "UNLOAD AND SET UP"] },
    { time: "12:00PM", actions: ["EVENT BEGINS", "APPS READY", "DINNER BUFFET OPEN", "DESSERT"] },
    { time: "4:00pm", actions: ["EVENT ENDS // ON SITE UNTIL THIS TIME", "LOAD UP AND ROLL OUT"] },
  ],
};

// ── Sample Data — Delivery BEO ──
const DELIVERY_SAMPLE: BEOData = {
  serviceType: "delivery",
  client: "Penn Medicine",
  contact: "Marlene Kromchad",
  phone: "267-319-2612",
  address: "3400 Civic Center Blvd (Perlman Center - Loading Dock)",
  cityState: "Philadelphia, PA 19104",
  orderNumber: "012326-4",
  eventDate: "Friday, January 23, 2026",
  guestCount: "15",
  deliveryTime: "9:45-10AM DELIVERY",
  deliveryNotes: "CALL MARLENE UPON ARRIVAL\nSEND WITH ORDER #1",
  employee: "NM",
  allergyBanner: "GLUTEN ALLERGIES - AVOID CROSS CONTAMINATION!!",
  noKitchenOnSite: false,
  isBuffet: false,
  sections: [
    {
      title: "DELI",
      vessel: "DISPOSABLE",
      items: [
        { qty: "", name: "", groupHeader: "foodwerx Classic Sandwiches - Topped w/ Sliced Roma Tomato & Green Leaf Lettuce", subItems: [] },
        { qty: "3", name: "Oven Roasted Turkey & Swiss" },
        { qty: "3", name: "Roast Beef & White Cheddar" },
        { qty: "3", name: "Grilled Chicken & Pepperjack" },
        { qty: "2", name: "Honey Ham & American Cheese" },
        {
          qty: "2", name: "Marinated Grilled Vegetables - Buffalo Mozzarella, Greens, Basil Pesto, Pepper & Balsamic Vinaigrette",
          customSpec: "SEPARATE PLATTER - VEGAN/ VEGETARIAN!!",
        },
        { qty: "2", name: "Sandwiches", customSpec: "GLUTEN FREE" },
        { qty: "1", name: "Mayo" },
        { qty: "1", name: "Spicy Mustard" },
      ],
    },
    {
      title: "SALAD",
      vessel: "DISPOSABLE",
      items: [
        { qty: "LRG KRAFT BG", name: "Housemade Potato Chips", customSpec: "LABEL: MAY CONTAIN TRACE GLUTEN" },
        {
          qty: "MD PKD", name: "Field of Greens Salad",
          customSpec: "GLUTEN FREE",
          subItems: [
            { text: "w/ Balsamic Vinaigrette" },
            { text: "w/ Ranch Dressing" },
          ],
        },
        { qty: "3#", name: "Tri-Colored Rotini Pasta Salad" },
        { qty: "3#", name: "Seasonal Fruit Salad" },
      ],
    },
    {
      title: "DESSERTS",
      vessel: "DISPOSABLE",
      items: [
        { qty: "", name: "", groupHeader: "Cookies Cookies Cookies", subItems: [] },
        { qty: "18", name: "Mini Cookies" },
        { qty: "14", name: "Tastykake Break - 4 Selections" },
      ],
    },
  ],
  paperProductsIncluded: true,
  paperProducts: [
    { qty: "18", item: "LARGE PLATE" },
    { qty: "18", item: "FORK" },
    { qty: "10", item: "KNIFE" },
    { qty: "2", item: "TEASPOONS" },
    { qty: "20", item: "DINNER NAPKIN" },
    { qty: "5", item: "TONGS" },
    { qty: "3", item: "SERVING SPOONS" },
  ],
  deliveryBeveragesIncluded: true,
  deliveryBeverages: [
    { qty: "16 (HEAVY ON DIET)", item: "SODA CAN (COKE, DIET, SPRITE)" },
  ],
};

// ── Styles ──
const print: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    color: "#000",
    padding: "20px 32px",
    maxWidth: 900,
    margin: "0 auto",
    fontSize: 13,
    lineHeight: 1.4,
  },
  headerTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: "2px solid #000",
    marginBottom: 0,
  },
  headerCell: {
    padding: "2px 8px",
    fontSize: 12,
    border: "1px solid #000",
    verticalAlign: "top",
  },
  headerLabel: {
    fontWeight: 700,
    color: "#000",
    whiteSpace: "nowrap" as const,
  },
  sectionBanner: {
    background: "#ffff00",
    color: "#000",
    textAlign: "center" as const,
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 0",
    margin: "12px 0 4px 0",
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
  redSectionBanner: {
    background: "#ff0000",
    color: "#fff",
    textAlign: "center" as const,
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 0",
    margin: "12px 0 4px 0",
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
  blueSectionBanner: {
    background: "#87ceeb",
    color: "#000",
    textAlign: "center" as const,
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 0",
    margin: "12px 0 4px 0",
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
  yellowSectionBanner: {
    background: "#ffff00",
    color: "#000",
    textAlign: "center" as const,
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 0",
    margin: "12px 0 4px 0",
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
  allergyBanner: {
    textAlign: "center" as const,
    fontSize: 18,
    fontWeight: 700,
    color: "#ff0000",
    padding: "8px 0",
    margin: "8px 0",
  },
  kitchenBanner: {
    textAlign: "center" as const,
    fontSize: 16,
    fontWeight: 700,
    color: "#ff0000",
    padding: "6px 0",
    margin: "4px 0",
  },
  specialNoteBanner: {
    textAlign: "center" as const,
    fontWeight: 700,
    fontSize: 12,
    padding: "4px 0",
    borderTop: "1px solid #000",
    borderBottom: "1px solid #000",
    background: "#eee",
  },
  itemRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    padding: "3px 0",
    alignItems: "flex-start",
  },
  itemQty: {
    fontWeight: 700,
    textAlign: "right" as const,
    paddingRight: 16,
    fontSize: 13,
  },
  itemName: { fontSize: 13 },
  subItemRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    padding: "0",
    alignItems: "flex-start",
  },
  subItemText: { fontSize: 13, paddingLeft: 0 },
  groupHeader: {
    color: "#0000ff",
    textDecoration: "underline",
    fontSize: 13,
    padding: "6px 0 2px 0",
  },
  customSpec: {
    color: "#ff0000",
    fontWeight: 700,
    fontSize: 13,
  },
  breadVessel: {
    color: "#0000ff",
    fontWeight: 400,
    fontSize: 13,
  },
  callout: {
    color: "#ff0000",
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 0",
    textAlign: "center" as const,
  },
  spacer: { height: 8 },
  notesSection: {
    padding: "8px 24px",
    textAlign: "center" as const,
  },
  noteItem: {
    fontSize: 12,
    fontWeight: 700,
    padding: "2px 0",
    lineHeight: 1.4,
    textTransform: "uppercase" as const,
  },
  noteItemHighlight: {
    fontSize: 13,
    fontWeight: 700,
    padding: "2px 0",
    color: "#ff0000",
  },
  timelineRow: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    padding: "2px 24px",
    alignItems: "flex-start",
    lineHeight: 1.4,
  },
  timelineTime: { fontWeight: 700, fontSize: 12 },
  timelineAction: { fontWeight: 700, fontSize: 12, textTransform: "uppercase" as const },
  paperTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: "1px solid #000",
    fontSize: 12,
  },
  paperCell: {
    border: "1px solid #000",
    padding: "2px 8px",
    fontWeight: 700,
  },
  twoColTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: "1px solid #000",
    fontSize: 12,
  },
  twoColCell: {
    padding: "4px 8px",
    verticalAlign: "top",
    width: "50%",
    border: "1px solid #000",
    lineHeight: 1.35,
  },
  twoColHeader: {
    padding: "4px 8px",
    fontWeight: 700,
    textAlign: "center" as const,
    width: "50%",
    border: "1px solid #000",
  },
  beverageLine: {
    lineHeight: 1.4,
    margin: 0,
    padding: "1px 0",
    fontSize: 12,
  },
  notesLine: {
    lineHeight: 1.4,
    margin: 0,
    padding: "2px 0",
    fontSize: 12,
  },
  timelineLine: {
    lineHeight: 1.4,
    margin: 0,
    padding: "2px 0",
    fontSize: 12,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: "8px 16px",
    borderBottom: "1px solid #ddd",
    background: "#1a1a1a",
    flexWrap: "wrap" as const,
    gap: 12,
  },
  backBtn: {
    padding: "8px 20px",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  viewToggle: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
  },
  toggleBtn: {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "#fff",
  },
  printBtn: {
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    border: "2px solid #2e7d32",
    borderRadius: 4,
    cursor: "pointer",
    background: "#4caf50",
    color: "#ffffff",
    minWidth: 120,
    flexShrink: 0,
  },
};

// ── Render Helpers ──
const renderHeader = (beo: BEOData) => {
  if (beo.serviceType === "full-service") {
    return (
      <>
        <table style={print.headerTable}>
          <tbody>
            <tr>
              <td style={{ ...print.headerCell, width: "15%" }}><span style={print.headerLabel}>CLIENT</span></td>
              <td style={{ ...print.headerCell, width: "35%" }}>{beo.client}</td>
              <td style={{ ...print.headerCell, width: "15%" }}><span style={print.headerLabel}>ORDER NUMBER</span></td>
              <td style={{ ...print.headerCell, width: "35%", color: "#ff0000", fontWeight: 700 }}>{beo.orderNumber}</td>
            </tr>
            <tr>
              <td style={print.headerCell}><span style={print.headerLabel}>CONTACT</span></td>
              <td style={print.headerCell}>{beo.contact}</td>
              <td style={print.headerCell}><span style={print.headerLabel}>EVENT DATE</span></td>
              <td style={print.headerCell}>{beo.eventDate}</td>
            </tr>
            <tr>
              <td style={print.headerCell}><span style={print.headerLabel}>PHONE</span></td>
              <td style={print.headerCell}>{beo.phone}</td>
              <td style={print.headerCell}><span style={print.headerLabel}>GUESTS</span></td>
              <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.guestCount}</td>
            </tr>
            <tr>
              <td style={print.headerCell}><span style={print.headerLabel}>ADDRESS</span></td>
              <td style={print.headerCell}>{beo.address}</td>
              <td style={print.headerCell}><span style={print.headerLabel}>EVENT START</span></td>
              <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.eventStart}</td>
            </tr>
            <tr>
              <td style={print.headerCell}><span style={print.headerLabel}>CITY, ST</span></td>
              <td style={print.headerCell}>{beo.cityState}</td>
              <td style={print.headerCell}><span style={print.headerLabel}>EVENT END</span></td>
              <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.eventEnd}</td>
            </tr>
            <tr>
              <td style={print.headerCell}></td>
              <td style={print.headerCell}></td>
              <td style={print.headerCell}><span style={print.headerLabel}>FW STAFF</span></td>
              <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.fwStaff}</td>
            </tr>
            <tr>
              <td style={{ ...print.headerCell, background: "#ff0000" }}></td>
              <td style={{ ...print.headerCell, background: "#ff0000" }}></td>
              <td style={{ ...print.headerCell, background: "#ff0000", color: "#fff", fontWeight: 700 }}>STAFF ARRIVAL</td>
              <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.staffArrival}</td>
            </tr>
          </tbody>
        </table>
        {(beo.invoice || beo.rentals || beo.eventOccasion) && (
          <div style={{ display: "flex", gap: 32, padding: "4px 8px", fontSize: 12, borderBottom: "1px solid #000" }}>
            {beo.eventOccasion && <span><strong>Occasion:</strong> {beo.eventOccasion}</span>}
            {beo.invoice && <span><strong>Invoice:</strong> {beo.invoice}</span>}
            {beo.rentals && <span><strong>Rentals:</strong> <span style={{ color: "#0000ff" }}>{beo.rentals}</span></span>}
            {beo.updatedBy && <span style={{ marginLeft: "auto" }}><strong>Updated:</strong> {beo.updatedBy}</span>}
            {beo.updatedDate && <span>{beo.updatedDate}</span>}
          </div>
        )}
      </>
    );
  }

  return (
    <table style={print.headerTable}>
      <tbody>
        <tr>
          <td style={{ ...print.headerCell, width: "15%" }}><span style={print.headerLabel}>CLIENT</span></td>
          <td style={{ ...print.headerCell, width: "35%" }}>{beo.client}</td>
          <td style={{ ...print.headerCell, width: "18%" }}><span style={print.headerLabel}>HOUSE ORDER NUMBER</span></td>
          <td style={{ ...print.headerCell, width: "32%", color: "#ff0000", fontWeight: 700 }}>{beo.orderNumber}</td>
        </tr>
        <tr>
          <td style={print.headerCell}><span style={print.headerLabel}>CONTACT</span></td>
          <td style={print.headerCell}>{beo.contact}</td>
          <td style={print.headerCell}><span style={print.headerLabel}>EVENT DATE</span></td>
          <td style={print.headerCell}>{beo.eventDate}</td>
        </tr>
        <tr>
          <td style={print.headerCell}><span style={print.headerLabel}>PHONE</span></td>
          <td style={print.headerCell}>{beo.phone}</td>
          <td style={print.headerCell}><span style={print.headerLabel}>GUESTS</span></td>
          <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.guestCount}</td>
        </tr>
        <tr>
          <td style={print.headerCell}><span style={print.headerLabel}>ADDRESS</span></td>
          <td style={print.headerCell}>{beo.address}</td>
          <td style={print.headerCell}><span style={print.headerLabel}>DELIVERY TIME</span></td>
          <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700 }}>{beo.deliveryTime}</td>
        </tr>
        <tr>
          <td style={print.headerCell}><span style={print.headerLabel}>CITY, ST</span></td>
          <td style={print.headerCell}>{beo.cityState}</td>
          <td style={print.headerCell}><span style={print.headerLabel}>DELIVERY NOTES</span></td>
          <td style={{ ...print.headerCell, color: "#ff0000", fontWeight: 700, whiteSpace: "pre-line" }}>{beo.deliveryNotes}</td>
        </tr>
        <tr>
          <td style={{ ...print.headerCell, background: "#ff0000" }}></td>
          <td style={{ ...print.headerCell, background: "#ff0000" }}></td>
          <td style={{ ...print.headerCell, background: "#ff0000", color: "#fff", fontWeight: 700 }}>EMPLOYEE</td>
          <td style={print.headerCell}>{beo.employee}</td>
        </tr>
      </tbody>
    </table>
  );
};

const renderMenuItem = (item: MenuItem, idx: number) => {
  if (item.groupHeader) {
    return (
      <div key={idx} style={{ ...print.itemRow, gridTemplateColumns: "120px 1fr" }}>
        <div style={print.itemQty}></div>
        <div style={print.groupHeader}>{item.groupHeader}</div>
      </div>
    );
  }

  if (item.isCallout) {
    return (
      <div key={idx} style={print.callout}>
        ***{item.name}***
      </div>
    );
  }

  return (
    <React.Fragment key={idx}>
      <div style={print.itemRow}>
        <div style={print.itemQty}>{item.qty}</div>
        <div style={print.itemName}>
          {item.name}
          {item.customSpec && (
            <span style={{ ...print.customSpec, marginLeft: 6 }}>
              {" "}- {item.customSpec}
            </span>
          )}
          {item.breadVessel && (
            <span style={{ ...print.breadVessel, marginLeft: 6 }}>
              {" "}- {item.breadVessel}
            </span>
          )}
        </div>
      </div>
      {item.subItems?.map((sub, sIdx) => (
        <div key={`${idx}-sub-${sIdx}`} style={print.subItemRow}>
          <div style={{ ...print.itemQty, color: sub.color === "red" ? "#ff0000" : "#000" }}>
            {sub.text.startsWith("w/") ? "#" : ""}
          </div>
          <div
            style={{
              ...print.subItemText,
              color: sub.color === "red" ? "#ff0000" : sub.color === "blue" ? "#0000ff" : "#000",
              fontWeight: sub.color === "red" ? 700 : 400,
            }}
          >
            {sub.text}
          </div>
        </div>
      ))}
      {/* Skip spacer for child rows (indented with "  ") so parent/child stay grouped */}
      {!item.name.startsWith("  ") && <div style={print.spacer} />}
    </React.Fragment>
  );
};

const renderSection = (section: MenuSection, idx: number) => (
  <div key={idx}>
    <div style={print.sectionBanner}>
      {section.title} - {section.vessel}
    </div>
    {section.items.map((item, iIdx) => renderMenuItem(item, iIdx))}
  </div>
);

const renderPage2FullService = (beo: BEOData) => (
  <>
    <div style={print.redSectionBanner}>BEVERAGES</div>
    <table style={print.twoColTable}>
      <thead>
        <tr>
          <td style={print.twoColHeader}>CLIENT</td>
          <td style={print.twoColHeader}>BEVERAGES</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={print.twoColCell}>
            {beo.beveragesClient?.map((b, i) => (
              <div key={i} style={print.beverageLine}>{b}</div>
            ))}
            {(!beo.beveragesClient || beo.beveragesClient.length === 0) && <div style={{ ...print.beverageLine, color: "#999" }}>—</div>}
          </td>
          <td style={print.twoColCell}>
            {dedupeBeverageLines(beo.beveragesFoodwerx ?? []).map((b, i) => (
              <div key={i} style={print.beverageLine}>{b}</div>
            ))}
            {(!beo.beveragesFoodwerx || beo.beveragesFoodwerx.length === 0) && <div style={{ ...print.beverageLine, color: "#999" }}>—</div>}
          </td>
        </tr>
      </tbody>
    </table>

    <div style={print.yellowSectionBanner}>PAPER PRODUCTS/CHINA - CUTLERY - GLASSWARE</div>
    <table style={print.twoColTable}>
      <thead>
        <tr>
          <td style={print.twoColHeader}>CLIENT</td>
          <td style={print.twoColHeader}>SERVICEWARE</td>
        </tr>
        <tr>
          <td style={{ ...print.twoColHeader, color: "#ff0000" }}>IN HOUSE</td>
          <td style={{ ...print.twoColHeader, color: "#0000ff" }}>FOODWERX PACK OUT</td>
        </tr>
      </thead>
      <tbody>
        {beo.serviceware?.map((row, i) => (
          <tr key={i}>
            <td style={print.twoColCell}>{row.clientSide}</td>
            <td style={{ ...print.twoColCell, textAlign: "center" }}>{row.foodwerxSide}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={print.yellowSectionBanner}>NOTES</div>
    <div style={{ ...print.notesSection, border: "1px solid #000", borderTop: "none", padding: "8px 16px" }}>
      {beo.notes?.map((note, i) => (
        <div
          key={i}
          style={note.includes("YES") || note.includes("FRIDGE") ? print.noteItemHighlight : print.noteItem}
        >
          {note}
        </div>
      ))}
    </div>

    <div style={print.blueSectionBanner}>TIMELINE</div>
    <div style={{ border: "1px solid #000", borderTop: "none", padding: "4px 0" }}>
    {beo.timeline?.map((entry, i) => (
      <div key={i}>
        {entry.actions.map((action, aIdx) => (
          <div key={aIdx} style={print.timelineRow}>
            <div style={print.timelineTime}>{aIdx === 0 ? entry.time : ""}</div>
            <div style={print.timelineAction}>{action}</div>
          </div>
        ))}
      </div>
    ))}
    </div>
  </>
);

const renderPaperProductsDelivery = (beo: BEOData) => (
  <>
    <div style={print.redSectionBanner}>PAPER PRODUCTS & BEVERAGES</div>
    <table style={print.paperTable}>
      <thead>
        <tr>
          <td style={{ ...print.paperCell, background: "#ff0000", color: "#fff", width: "10%", textAlign: "center" }}>
            {beo.paperProductsIncluded ? "YES" : "NO"}
          </td>
          <td style={{ ...print.paperCell, background: "#ff0000", color: "#fff", width: "40%" }}>
            STANDARD PAPER PRODUCTS
          </td>
          <td style={{ ...print.paperCell, background: "#ff0000", color: "#fff", width: "35%" }}>
            BEVERAGES
          </td>
          <td style={{ ...print.paperCell, background: "#ff0000", color: "#fff", width: "15%", textAlign: "center" }}>
            {beo.deliveryBeveragesIncluded ? "YES" : "NO"}
          </td>
        </tr>
      </thead>
      <tbody>
        {Array.from({
          length: Math.max(beo.paperProducts?.length || 0, beo.deliveryBeverages?.length || 0),
        }).map((_, i) => (
          <tr key={i}>
            <td style={{ ...print.paperCell, textAlign: "center" }}>
              {beo.paperProducts?.[i]?.qty || ""}
            </td>
            <td style={print.paperCell}>{beo.paperProducts?.[i]?.item || ""}</td>
            <td style={{ ...print.paperCell, color: "#ff0000", fontWeight: 700 }}>
              {beo.deliveryBeverages?.[i]?.item || ""}
            </td>
            <td style={{ ...print.paperCell, textAlign: "center" }}>
              {beo.deliveryBeverages?.[i]?.qty || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

// ── Section config for building from event data ──
const MENU_SECTION_CONFIG: { title: string; fieldId: string }[] = [
  { title: "PASSED APPETIZERS", fieldId: FIELD_IDS.PASSED_APPETIZERS },
  { title: "PRESENTED APPETIZERS", fieldId: FIELD_IDS.PRESENTED_APPETIZERS },
  { title: "BUFFET – METAL", fieldId: FIELD_IDS.BUFFET_METAL },
  { title: "BUFFET – CHINA", fieldId: FIELD_IDS.BUFFET_CHINA },
  { title: "DESSERTS", fieldId: FIELD_IDS.DESSERTS },
  { title: "STATIONS", fieldId: FIELD_IDS.STATIONS },
  { title: "ROOM TEMP/DISPLAYS", fieldId: FIELD_IDS.ROOM_TEMP_DISPLAY },
];

const MENU_TABLE = "tbl0aN33DGG6R1sPZ";
const ITEM_NAME = FIELD_IDS.MENU_ITEM_NAME;
const CHILD_ITEMS = FIELD_IDS.MENU_ITEM_CHILD_ITEMS;

/** Remove consecutive duplicate lines (e.g. "COFFEE SERVICE" appearing twice) */
function dedupeBeverageLines(lines: string[]): string[] {
  return lines.filter((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const prev = lines[i - 1]?.trim();
    return prev !== trimmed;
  });
}

/** Format EVENT_DATE (YYYY-MM-DD) to "Saturday, March 15, 2025" or "3/15/2025" */
function formatEventDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Parse serviceware list (• Item (Supplier) – qty) into { item, qty, supplier } */
function parseServicewareLines(text: string): { item: string; qty: string; supplier: string }[] {
  const lines = (text || "").split(/\n/).filter(Boolean);
  const items: { item: string; qty: string; supplier: string }[] = [];
  for (const line of lines) {
    const bullet = (line.startsWith("•") ? line.slice(1) : line).trim();
    if (!bullet) continue;
    const parenStart = bullet.indexOf("(");
    const parenEnd = bullet.indexOf(")");
    let itemName = bullet;
    let qty = "";
    let supplier = "";
    if (parenStart >= 0 && parenEnd > parenStart) {
      itemName = bullet.slice(0, parenStart).trim();
      supplier = bullet.slice(parenStart + 1, parenEnd).trim();
      const rest = bullet.slice(parenEnd + 1).trim();
      const dashMatch = rest.match(/[–\-]\s*(.+)/);
      if (dashMatch) qty = dashMatch[1].replace("Provided by host", "").trim();
    }
    if (itemName) items.push({ item: itemName, qty, supplier });
  }
  return items;
}

/** Build delivery beverages from hydration/soda fields */
function buildDeliveryBeveragesFromEvent(fields: Record<string, unknown> | null): BeverageItem[] {
  if (!fields) return [];
  const items: BeverageItem[] = [];
  const soda = asStringArray(fields[FIELD_IDS.HYDRATION_SODA_SELECTION]);
  if (soda.length > 0) items.push({ qty: "", item: soda.join(", ") });
  const water = asSingleSelectName(fields[FIELD_IDS.HYDRATION_BOTTLED_WATER]);
  if (water) items.push({ qty: "", item: `Bottled Water: ${water}` });
  const other = asString(fields[FIELD_IDS.HYDRATION_OTHER]);
  if (other?.trim()) items.push({ qty: "", item: other });
  return items;
}

/** Build paper products from PLATES_LIST, CUTLERY_LIST, GLASSWARE_LIST (for delivery table) */
function buildPaperProductsFromEvent(fields: Record<string, unknown> | null): PaperProduct[] {
  if (!fields) return [];
  const all: { item: string; qty: string }[] = [];
  for (const fid of [FIELD_IDS.PLATES_LIST, FIELD_IDS.CUTLERY_LIST, FIELD_IDS.GLASSWARE_LIST]) {
    parseServicewareLines(asString(fields[fid])).forEach((p) => all.push({ item: p.item, qty: p.qty }));
  }
  return all;
}

/** Build serviceware rows from event data (CLIENT | SERVICEWARE columns) */
function buildServicewareFromEvent(fields: Record<string, unknown> | null): ServicewareRow[] {
  if (!fields) return [];
  const source = asSingleSelectName(fields[FIELD_IDS.SERVICEWARE_SOURCE])?.toLowerCase() || "";
  const rows: ServicewareRow[] = [];
  if (source.includes("client") || source.includes("mixed")) {
    rows.push({ clientSide: "IN HOUSE", foodwerxSide: "" });
  }
  if (source.includes("foodwerx") || source.includes("mixed")) {
    rows.push({ clientSide: "", foodwerxSide: "FOODWERX PACK OUT" });
  }
  for (const fid of [FIELD_IDS.PLATES_LIST, FIELD_IDS.CUTLERY_LIST, FIELD_IDS.GLASSWARE_LIST]) {
    parseServicewareLines(asString(fields[fid])).forEach((p) => {
      const display = p.qty ? `${p.qty} ${p.item}` : p.item;
      const isClient = p.supplier.toLowerCase().includes("client");
      rows.push({ clientSide: isClient ? display : "", foodwerxSide: isClient ? "" : display });
    });
  }
  return rows.length > 0 ? rows : [{ clientSide: "IN HOUSE", foodwerxSide: "FOODWERX PACK OUT" }];
}

/** Parse BEO_TIMELINE long text into timeline entries. Expects lines like "10:30AM Staff arrival" or "10:30 AM - Action" */
function parseBEOTimeline(text: string | null | undefined): TimelineEntry[] {
  if (!text?.trim()) return [];
  const entries: TimelineEntry[] = [];
  const lines = text.split(/\n/).filter((l) => l.trim());
  let currentTime = "";
  for (const line of lines) {
    const match = line.match(/^(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?)\s*[:\-–]\s*(.+)/i) || line.match(/^(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?)\s+(.+)/i);
    if (match) {
      currentTime = match[1].replace(/\s+/g, "").toUpperCase().replace(/(\d)(AM|PM)/i, "$1 $2");
      entries.push({ time: currentTime, actions: [match[2].trim().toUpperCase()] });
    } else if (currentTime && line.trim()) {
      entries[entries.length - 1].actions.push(line.trim().toUpperCase());
    }
  }
  return entries;
}

// ── Main Component ──
const KitchenBEOPrintPage: React.FC = () => {
  const { selectedEventId, selectedEventData, loadEvents, loadEventData, selectEvent } = useEventStore();
  const [loading, setLoading] = useState(true);
  const [menuItemData, setMenuItemData] = useState<Record<string, { name: string; childIds: string[] }>>({});

  useEffect(() => {
    loadEvents().then(() => setLoading(false));
  }, [loadEvents]);

  // Parse event ID from URL: /kitchen-beo-print/recXXX
  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const idx = parts.indexOf("kitchen-beo-print");
    const urlEventId = idx !== -1 && parts[idx + 1] ? parts[idx + 1] : null;
    if (urlEventId && urlEventId !== selectedEventId) {
      selectEvent(urlEventId).then(() => setLoading(false));
    }
  }, []);

  // Load event data when we have selectedEventId (e.g. from EventSelector or URL)
  useEffect(() => {
    if (selectedEventId) {
      loadEventData().then(() => setLoading(false));
    }
  }, [selectedEventId, loadEventData]);

  // Fetch menu items with Item Name + Child Items (linked records)
  useEffect(() => {
    const parentIds = new Set<string>();
    MENU_SECTION_CONFIG.forEach((c) => {
      const val = selectedEventData[c.fieldId];
      if (Array.isArray(val)) {
        val.forEach((id: unknown) => {
          if (typeof id === "string" && id.startsWith("rec")) parentIds.add(id);
        });
      }
    });
    if (parentIds.size === 0) return;

    const apiKey = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
    const baseId = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";
    if (!apiKey || !baseId) return;

    const fetchMenuItems = async () => {
      const newData: Record<string, { name: string; childIds: string[] }> = {};
      const toFetch = [...parentIds];

      const fetchChunk = async (ids: string[]) => {
        const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
        const params = new URLSearchParams();
        params.set("filterByFormula", formula);
        params.set("returnFieldsByFieldId", "true");
        params.append("fields[]", ITEM_NAME);
        params.append("fields[]", CHILD_ITEMS);
        const res = await fetch(
          `https://api.airtable.com/v0/${baseId}/${MENU_TABLE}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const data = await res.json();
        if (data.records) {
          data.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
            const name = rec.fields[ITEM_NAME];
            const childRaw = rec.fields[CHILD_ITEMS];
            const childIds = Array.isArray(childRaw)
              ? childRaw.filter((c): c is string => typeof c === "string" && c.startsWith("rec"))
              : [];
            newData[rec.id] = {
              name: typeof name === "string" ? name : rec.id,
              childIds,
            };
          });
        }
      };

      try {
        for (let i = 0; i < toFetch.length; i += 10) {
          await fetchChunk(toFetch.slice(i, i + 10));
        }
        const childIdsToFetch = new Set<string>();
        Object.values(newData).forEach((d) => {
          d.childIds.forEach((cid) => {
            if (!newData[cid]) childIdsToFetch.add(cid);
          });
        });
        if (childIdsToFetch.size > 0) {
          const childParams = new URLSearchParams();
          childParams.set("filterByFormula", `OR(${[...childIdsToFetch].map((id) => `RECORD_ID()='${id}'`).join(",")})`);
          childParams.set("returnFieldsByFieldId", "true");
          childParams.append("fields[]", ITEM_NAME);
          const res = await fetch(
            `https://api.airtable.com/v0/${baseId}/${MENU_TABLE}?${childParams.toString()}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const childData = await res.json();
          if (childData.records) {
            childData.records.forEach((rec: { id: string; fields: Record<string, unknown> }) => {
              const name = rec.fields[ITEM_NAME];
              if (!newData[rec.id]) {
                newData[rec.id] = { name: typeof name === "string" ? name : rec.id, childIds: [] };
              } else {
                newData[rec.id].name = typeof name === "string" ? name : rec.id;
              }
            });
          }
        }
        setMenuItemData(newData);
      } catch (e) {
        console.error("Failed to fetch menu items:", e);
      }
    };
    fetchMenuItems();
  }, [selectedEventData]);

  // Build sections from event data with parent/child from linked Child Items
  const buildSectionsFromEvent = (isDelivery: boolean): MenuSection[] => {
    const guestCount = parseInt(asString(selectedEventData[FIELD_IDS.GUEST_COUNT]) || "0", 10);
    const sections: MenuSection[] = [];

    for (const config of MENU_SECTION_CONFIG) {
      const raw = selectedEventData[config.fieldId];
      if (!raw || !Array.isArray(raw)) continue;

      const items: MenuItem[] = [];
      for (const item of raw) {
        const id = typeof item === "string" ? item : (item && typeof item === "object" && "id" in item) ? (item as { id: string }).id : String(item);
        const data = menuItemData[id];
        const parentName = data?.name || "Loading...";
        const childIds = data?.childIds ?? [];
        const rows = expandItemToRows(parentName, childIds, menuItemData);
        if (rows.length === 0) continue;
        const spec = calculateSpec({
          itemId: id,
          itemName: parentName,
          section: config.title,
          guestCount,
        });
        items.push({
          qty: spec,
          name: parentName,
          subItems: rows.length > 1
            ? rows.slice(1).map((r) => ({ text: r.lineName }))
            : undefined,
        });
      }
      if (items.length > 0) {
        sections.push({
          title: config.title,
          vessel: getVesselForSection(config.title, isDelivery),
          items,
        });
      }
    }
    return sections;
  };

  // Detect service type: Full Service, Delivery, or Pick Up
  const eventTypeRaw = asSingleSelectName(selectedEventData?.[FIELD_IDS.EVENT_TYPE])?.toLowerCase() ?? "";
  const isPickUp = eventTypeRaw.includes("pick up") || eventTypeRaw.includes("pickup");
  const isDelivery = eventTypeRaw.includes("delivery") || isPickUp;
  const serviceType: "full-service" | "delivery" = isDelivery ? "delivery" : "full-service";

  // Build BEO data from real event — use formula/print fields when available, fallback to source fields
  const venueAddress = asString(selectedEventData?.[FIELD_IDS.PRINT_VENUE_ADDRESS]) || asString(selectedEventData?.[FIELD_IDS.VENUE_ADDRESS]);
  const clientAddress = [asString(selectedEventData?.[FIELD_IDS.CLIENT_STREET]), asString(selectedEventData?.[FIELD_IDS.CLIENT_CITY]), asSingleSelectName(selectedEventData?.[FIELD_IDS.CLIENT_STATE]), asString(selectedEventData?.[FIELD_IDS.CLIENT_ZIP])].filter(Boolean).join(", ");
  const venueCityState = [asString(selectedEventData?.[FIELD_IDS.VENUE_CITY]), asSingleSelectName(selectedEventData?.[FIELD_IDS.VENUE_STATE])].filter(Boolean).join(", ");
  const clientCityState = [asString(selectedEventData?.[FIELD_IDS.CLIENT_CITY]), asSingleSelectName(selectedEventData?.[FIELD_IDS.CLIENT_STATE]), asString(selectedEventData?.[FIELD_IDS.CLIENT_ZIP])].filter(Boolean).join(", ");

  const beo: BEOData = selectedEventData ? {
    serviceType,
    client: (asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]) + " " + asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME])).trim() || asString(selectedEventData[FIELD_IDS.CLIENT_BUSINESS_NAME]) || "No Client",
    contact: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]),
    phone: asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]) || asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_PHONE]),
    address: isPickUp ? "PICK UP" : (venueAddress || asString(selectedEventData[FIELD_IDS.CLIENT_STREET]) || clientAddress),
    cityState: isPickUp ? "" : (venueCityState || clientCityState),
    orderNumber: "",
    eventDate: formatEventDate(asString(selectedEventData[FIELD_IDS.EVENT_DATE])) || asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
    guestCount: String(selectedEventData[FIELD_IDS.GUEST_COUNT] || ""),
    eventStart: secondsTo12HourString(selectedEventData[FIELD_IDS.EVENT_START_TIME]) || "",
    eventEnd: secondsTo12HourString(selectedEventData[FIELD_IDS.EVENT_END_TIME]) || "",
    fwStaff: asString(selectedEventData[FIELD_IDS.CAPTAIN]) || asString(selectedEventData[FIELD_IDS.SERVERS]) || asString(selectedEventData[FIELD_IDS.STAFF]) || "",
    staffArrival: secondsTo12HourString(selectedEventData[FIELD_IDS.FOODWERX_ARRIVAL]) || asString(selectedEventData[FIELD_IDS.VENUE_ARRIVAL_TIME]) || "",
    deliveryTime: isPickUp ? "PICK UP" : (secondsTo12HourString(selectedEventData[FIELD_IDS.DISPATCH_TIME]) || asString(selectedEventData[FIELD_IDS.DISPATCH_TIME]) || ""),
    deliveryNotes: asString(selectedEventData[FIELD_IDS.SPECIAL_NOTES]) || "",
    employee: asString(selectedEventData[FIELD_IDS.CAPTAIN]) || "",
    allergyBanner: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]) ? `ALLERGIES: ${asString(selectedEventData[FIELD_IDS.DIETARY_NOTES])}` : undefined,
    noKitchenOnSite: asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]) === "No",
    isBuffet: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE])?.toLowerCase().includes("buffet") || false,
    kitchenBanner: asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]) === "No" && asBoolean(selectedEventData[FIELD_IDS.FOOD_MUST_GO_HOT])
      ? "NO KITCHEN ON SITE — ALL FOOD MUST GO HOT"
      : undefined,
    eventOccasion: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_OCCASION]) || undefined,
    sections: buildSectionsFromEvent(isDelivery),
    notes: asString(selectedEventData[FIELD_IDS.BEO_NOTES]) ? asString(selectedEventData[FIELD_IDS.BEO_NOTES]).split("\n").filter(Boolean) : [],
    timeline: parseBEOTimeline(asString(selectedEventData[FIELD_IDS.BEO_TIMELINE])),
    beveragesFoodwerx: asString(selectedEventData[FIELD_IDS.BAR_SERVICE_KITCHEN_BEO]) ? asString(selectedEventData[FIELD_IDS.BAR_SERVICE_KITCHEN_BEO]).split("\n").filter(Boolean) : undefined,
    serviceware: buildServicewareFromEvent(selectedEventData),
    paperProducts: buildPaperProductsFromEvent(selectedEventData),
    paperProductsIncluded: buildPaperProductsFromEvent(selectedEventData).length > 0 || !!asSingleSelectName(selectedEventData[FIELD_IDS.SERVICEWARE_SOURCE]),
    deliveryBeverages: buildDeliveryBeveragesFromEvent(selectedEventData),
    deliveryBeveragesIncluded: buildDeliveryBeveragesFromEvent(selectedEventData).length > 0,
  } : FULL_SERVICE_SAMPLE;

  const handlePrint = () => {
    // Brief delay so layout is fully painted before print dialog opens
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };

  return (
    <div className="kitchen-beo-print-page">
      <style>{`
        .kitchen-beo-print-page .kitchen-beo-toolbar {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
          padding: 8px 16px !important;
          margin-bottom: 16px !important;
          background: #1a1a1a !important;
          border-bottom: 1px solid #ddd !important;
        }
        .kitchen-beo-print-page .kitchen-beo-print-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 10px 24px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          background: #4caf50 !important;
          color: #ffffff !important;
          border: 2px solid #2e7d32 !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          min-width: 120px !important;
          flex-shrink: 0 !important;
        }
        .kitchen-beo-print-page .kitchen-beo-print-btn:hover {
          background: #43a047 !important;
        }
        @media print {
          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .kitchen-beo-print-page {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .kitchen-beo-print-page .kitchen-beo-print-content {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .kitchen-beo-print-page table,
          .kitchen-beo-print-page td,
          .kitchen-beo-print-page th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @page {
          size: 8.5in 11in;
          margin: 0.5in;
        }
      `}</style>
      <div style={print.toolbar} className="no-print kitchen-beo-toolbar">
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          <button type="button" style={print.backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
          {selectedEventId && (
            <button
              type="button"
              style={{ ...print.backBtn, background: "#555" }}
              onClick={() => { window.location.href = `/beo-print/${selectedEventId}`; }}
            >
              Full BEO (tabs & checklist)
            </button>
          )}
          <button type="button" className="kitchen-beo-print-btn" style={print.printBtn} onClick={handlePrint} title="Print this BEO">
            Print
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0, maxWidth: "400px", margin: "0 20px" }}>
          <EventSelector variant="beo-header" />
        </div>
      </div>

      <div className="kitchen-beo-print-content" style={print.page}>
        {renderHeader(beo)}

        {beo.serviceType === "delivery" && (
          <>
            <div style={print.specialNoteBanner}>SPECIAL NOTES</div>
            {beo.notes && beo.notes.length > 0 && (
              <div style={{ padding: "8px 16px", fontSize: 12 }}>
                {beo.notes.map((n, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>{n}</div>
                ))}
              </div>
            )}
          </>
        )}

        {beo.allergyBanner && (
          <div style={print.allergyBanner}>{beo.allergyBanner}</div>
        )}

        {beo.noKitchenOnSite && !beo.isBuffet && beo.kitchenBanner && (
          <div style={print.kitchenBanner}>{beo.kitchenBanner}</div>
        )}

        {selectedEventData && beo.sections.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#666", fontSize: 14 }}>
            No menu items assigned to this event yet. Select an event with menu items or add items in BEO Intake.
          </div>
        )}

        {beo.sections.map((section, idx) => renderSection(section, idx))}

        {beo.serviceType === "delivery" && renderPaperProductsDelivery(beo)}

        {beo.serviceType === "full-service" && renderPage2FullService(beo)}
      </div>
    </div>
  );
};

export default KitchenBEOPrintPage;
