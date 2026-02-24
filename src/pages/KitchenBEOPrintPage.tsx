import React, { useState, useEffect } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";
import { asString, asSingleSelectName, asBoolean, asLinkedRecordIds } from "../services/airtable/selectors";
import { EventSelector } from "../components/EventSelector";

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
    fontSize: 13,
    fontWeight: 700,
    padding: "2px 0",
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
  },
  timelineTime: { fontWeight: 700, fontSize: 13 },
  timelineAction: { fontWeight: 700, fontSize: 13, textTransform: "uppercase" as const },
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
    fontSize: 12,
  },
  twoColCell: {
    padding: "2px 16px",
    verticalAlign: "top",
    width: "50%",
  },
  twoColHeader: {
    padding: "2px 16px",
    fontWeight: 700,
    textAlign: "center" as const,
    width: "50%",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: "8px 16px",
    borderBottom: "1px solid #ddd",
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
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    background: "#4caf50",
    color: "#fff",
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
        {(beo.invoice || beo.rentals) && (
          <div style={{ display: "flex", gap: 32, padding: "4px 8px", fontSize: 12, borderBottom: "1px solid #000" }}>
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
      <div style={print.spacer} />
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
            {beo.beveragesClient?.map((b, i) => <div key={i}>{b}</div>)}
            {(!beo.beveragesClient || beo.beveragesClient.length === 0) && <div style={{ color: "#aaa" }}>—</div>}
          </td>
          <td style={print.twoColCell}>
            {beo.beveragesFoodwerx?.map((b, i) => <div key={i}>{b}</div>)}
            {(!beo.beveragesFoodwerx || beo.beveragesFoodwerx.length === 0) && <div style={{ color: "#aaa" }}>—</div>}
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
    <div style={print.notesSection}>
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

// ── Main Component ──
const KitchenBEOPrintPage: React.FC = () => {
  const { selectedEventId, selectedEventData, loadEvents, selectEvent } = useEventStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents().then(() => setLoading(false));
  }, [loadEvents]);

  // Build BEO data from real event
  const beo: BEOData = selectedEventData ? {
    serviceType: asSingleSelectName(selectedEventData[FIELD_IDS.EVENT_TYPE])?.toLowerCase().includes("delivery") ? "delivery" : "full-service",
    client: (asString(selectedEventData[FIELD_IDS.CLIENT_FIRST_NAME]) + " " + asString(selectedEventData[FIELD_IDS.CLIENT_LAST_NAME])).trim() || "No Client",
    contact: asString(selectedEventData[FIELD_IDS.PRIMARY_CONTACT_NAME]),
    phone: asString(selectedEventData[FIELD_IDS.CLIENT_PHONE]),
    address: asString(selectedEventData[FIELD_IDS.VENUE_ADDRESS]),
    cityState: (asString(selectedEventData[FIELD_IDS.VENUE_CITY]) + ", " + asSingleSelectName(selectedEventData[FIELD_IDS.VENUE_STATE])).trim(),
    orderNumber: "", // Job # — can be auto-generated later
    eventDate: asString(selectedEventData[FIELD_IDS.EVENT_DATE]),
    guestCount: String(selectedEventData[FIELD_IDS.GUEST_COUNT] || ""),
    eventStart: "", // Convert from seconds if needed
    eventEnd: "",
    allergyBanner: asString(selectedEventData[FIELD_IDS.DIETARY_NOTES]) || undefined,
    noKitchenOnSite: asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]) === "No",
    isBuffet: asSingleSelectName(selectedEventData[FIELD_IDS.SERVICE_STYLE])?.toLowerCase().includes("buffet") || false,
    kitchenBanner: asSingleSelectName(selectedEventData[FIELD_IDS.KITCHEN_ON_SITE]) === "No" && asBoolean(selectedEventData[FIELD_IDS.FOOD_MUST_GO_HOT]) 
      ? "NO KITCHEN ON SITE — ALL FOOD MUST GO HOT" 
      : undefined,
    sections: [], // Build from linked menu items — simplified for now
    notes: asString(selectedEventData[FIELD_IDS.BEO_NOTES]) ? asString(selectedEventData[FIELD_IDS.BEO_NOTES]).split("\n") : [],
    timeline: [], // Parse from BEO_TIMELINE text — simplified for now
  } : FULL_SERVICE_SAMPLE;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div style={print.toolbar} className="no-print">
        <button style={print.backBtn} onClick={() => window.history.back()}>
          ← Back
        </button>
        <div style={{ flex: 1, maxWidth: "400px", margin: "0 20px" }}>
          <EventSelector variant="beo-header" />
        </div>
        <button style={print.printBtn} onClick={handlePrint}>
          🖨️ Print
        </button>
      </div>

      <div style={print.page}>
        {renderHeader(beo)}

        {beo.serviceType === "delivery" && (
          <div style={print.specialNoteBanner}>SPECIAL NOTES</div>
        )}

        {beo.allergyBanner && (
          <div style={print.allergyBanner}>{beo.allergyBanner}</div>
        )}

        {beo.noKitchenOnSite && !beo.isBuffet && beo.kitchenBanner && (
          <div style={print.kitchenBanner}>{beo.kitchenBanner}</div>
        )}

        {beo.sections.map((section, idx) => renderSection(section, idx))}

        {beo.serviceType === "delivery" && beo.paperProducts && renderPaperProductsDelivery(beo)}

        {beo.serviceType === "full-service" && renderPage2FullService(beo)}
      </div>
    </div>
  );
};

export default KitchenBEOPrintPage;
