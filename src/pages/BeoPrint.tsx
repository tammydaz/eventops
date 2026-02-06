import { useEffect, useState } from "react";
import { useEventStore } from "../state/eventStore";
import { FIELD_IDS } from "../services/airtable/events";

export default function BeoPrint() {
  const { selectedEventId, eventData, loadEventData } = useEventStore();
  const [beo, setBeo] = useState({});

  useEffect(() => {
    if (selectedEventId) {
      // Placeholder: just pull print fields from eventData
      setBeo({
        printEventHeader: eventData[FIELD_IDS.PRINT_EVENT_HEADER] || "",
        printEventDetails: eventData[FIELD_IDS.PRINT_EVENT_DETAILS] || "",
        printClientBlock: eventData[FIELD_IDS.PRINT_CLIENT_BLOCK] || "",
        printAddressBlock: eventData[FIELD_IDS.PRINT_ADDRESS_BLOCK] || "",
      });
    }
  }, [selectedEventId, eventData]);

  if (!selectedEventId) return <div>Select an event to print BEO.</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">BEO Print Preview</h2>
      <div><strong>Event Header:</strong> {beo.printEventHeader || <em>None</em>}</div>
      <div><strong>Event Details:</strong> {beo.printEventDetails || <em>None</em>}</div>
      <div><strong>Client Block:</strong> {beo.printClientBlock || <em>None</em>}</div>
      <div><strong>Address Block:</strong> {beo.printAddressBlock || <em>None</em>}</div>
    </div>
  );
}
