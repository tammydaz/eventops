import React, { useEffect, useState } from "react";

const AIRTABLE_API_KEY = (import.meta.env.VITE_AIRTABLE_API_KEY as string)?.trim() || "";
const AIRTABLE_BASE_ID = (import.meta.env.VITE_AIRTABLE_BASE_ID as string)?.trim() || "";
const AIRTABLE_EVENTS_TABLE = (import.meta.env.VITE_AIRTABLE_EVENTS_TABLE as string)?.trim() || "";

const FIELD_MAP = {
  clientFirstName: "Client First Name",
  clientLastName: "Client Last Name",
  clientPhone: "Client Phone",
  clientEmail: "Client Email",
  primaryContactName: "Primary Contact Name",
  venue: "Venue",
  venueFullAddress: "Venue Full Address (Clean)",
  eventType: "Event Type",
  guestCount: "Guest Count",
  dispatchTime: "Dispatch Time",
  eventDate: "Event Date",
};

async function fetchAllAirtableRecords() {
  let records: any[] = [];
  let offset = "";
  const view = encodeURIComponent("API View (Unfiltered)");
  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE}?pageSize=100&view=${view}${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch events from Airtable.");
    const data = await res.json();
    records = records.concat(data.records || []);
    offset = data.offset || "";
  } while (offset);
  return records;
}

export default function POIntakeForm() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAllAirtableRecords()
      .then((records) => {
        setEvents(records);
        setError(null);
      })
      .catch(() => {
        setError("Failed to load events from Airtable.");
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const found = events.find((ev) => ev.id === selectedId);
    setSelected(found || null);
  }, [selectedId, events]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-950 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-red-500">PO Intake Form</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-200 rounded font-bold border border-red-600">
          {error}
        </div>
      )}
      <div className="mb-6">
        <label className="block font-bold mb-2">Select Event</label>
        <select
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading || events.length === 0}
        >
          <option value="">-- Choose an event --</option>
          {events.map((ev) => {
            const f = ev.fields || {};
            const label = `${f[FIELD_MAP.clientFirstName] || ""} ${f[FIELD_MAP.clientLastName] || ""} – ${f[FIELD_MAP.eventDate] || ""}`;
            return (
              <option key={ev.id} value={ev.id}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
      {selected && (
        <form className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Client First Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.clientFirstName] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Client Last Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.clientLastName] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Client Phone</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.clientPhone] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Client Email</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.clientEmail] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Primary Contact Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.primaryContactName] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Venue</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.venue] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Venue Full Address (Clean)</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.venueFullAddress] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Event Type</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.eventType] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Guest Count</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.guestCount] || ""}
              readOnly
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Dispatch Time</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              value={selected.fields[FIELD_MAP.dispatchTime] || ""}
              readOnly
            />
          </div>
        </form>
      )}
    </div>
  );
}
