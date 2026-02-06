import { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";

export default function FullIntake() {
  const { selectedEventId, eventData, updateEvent } = useEventStore();
  const [form, setForm] = useState({ ...eventData });

  useEffect(() => {
    setForm({ ...eventData });
  }, [eventData]);

  if (!selectedEventId) return <div>Select an event to begin intake.</div>;

  const handleChange = (fieldId, value) => {
    setForm((prev) => ({ ...prev, [fieldId]: value }));
    updateEvent(selectedEventId, { [fieldId]: value });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Full Intake Form</h2>
      <label>Event Name</label>
      <input
        value={form[FIELD_IDS.EVENT_NAME] || ""}
        onChange={e => handleChange(FIELD_IDS.EVENT_NAME, e.target.value)}
        className="block mb-2 border px-2 py-1"
      />
      <label>Event Date</label>
      <input
        type="date"
        value={form[FIELD_IDS.EVENT_DATE] || ""}
        onChange={e => handleChange(FIELD_IDS.EVENT_DATE, e.target.value)}
        className="block mb-2 border px-2 py-1"
      />
      {/* Add more fields as needed using FIELD_IDS */}
    </div>
  );
}
