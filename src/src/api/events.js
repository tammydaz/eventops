import { getEventsTable, airtableFetch } from "../services/airtable/client";
import { FIELD_IDS } from "../services/airtable/events";

export default async function handler(req, res) {
  try {
    const table = getEventsTable();
    if (typeof table !== "string") throw new Error("Invalid table");
    const params = new URLSearchParams();
    params.set("maxRecords", "200");
    params.set("cellFormat", "json");
    params.set("returnFieldsByFieldId", "true");
    params.append("fields[]", FIELD_IDS.EVENT_NAME);
    params.append("fields[]", FIELD_IDS.EVENT_DATE);
    params.append("fields[]", FIELD_IDS.EVENT_TYPE);
    params.append("fields[]", FIELD_IDS.SERVICE_STYLE);
    params.append("fields[]", FIELD_IDS.GUEST_COUNT);
    const data = await airtableFetch(`/${table}?${params.toString()}`);
    if (!data || !Array.isArray(data.records)) throw new Error("Airtable fetch failed");
    const events = data.records.map((record) => {
      const f = record.fields || {};
      return {
        id: record.id,
        eventName: f[FIELD_IDS.EVENT_NAME] || "",
        eventDate: f[FIELD_IDS.EVENT_DATE] || "",
        eventType: f[FIELD_IDS.EVENT_TYPE] || "",
        serviceStyle: f[FIELD_IDS.SERVICE_STYLE] || "",
        guestCount: f[FIELD_IDS.GUEST_COUNT] || "",
      };
    });
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify(events));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message || "Unknown error" }));
  }
}
