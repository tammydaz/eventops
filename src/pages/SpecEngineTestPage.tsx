/**
 * Dev page to run the spec engine on a test event and see output.
 * Navigate to /spec-engine-test or /spec-engine-test?eventId=recXXX
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { calculateSpecsForEvent } from "../lib/specs/calculateSpecs";
import { EventSelector } from "../components/EventSelector";
import { useEventStore } from "../state/eventStore";

export default function SpecEngineTestPage() {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");
  const { selectedEventId, loadEvents } = useEventStore();
  const [eventId, setEventId] = useState(eventIdFromUrl || selectedEventId || "");
  const [result, setResult] = useState<{
    items: Array<{ itemId: string; itemName: string; fwxSpecValue: number; industryValue: number; unitType: string; chaferCount: number; panCount?: number; notes: string }>;
    errors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (eventIdFromUrl) setEventId(eventIdFromUrl);
    else if (selectedEventId) setEventId(selectedEventId);
  }, [eventIdFromUrl, selectedEventId]);

  const runTest = async () => {
    if (!eventId.trim()) {
      setError("Enter an event ID (e.g. recXXXXXXXXXXXXXX)");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await calculateSpecsForEvent(eventId.trim());
      if ("error" in res) {
        setError(res.message ?? "Failed");
      } else {
        setResult(res);
        console.log("Spec Engine Output:", res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace", maxWidth: 800 }}>
      <h1>Spec Engine Test</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Run the spec engine on an event. Use an event ID from your Airtable Events table.
      </p>
      <div style={{ marginBottom: 16 }}>
        <EventSelector variant="default" />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Event ID (rec...)"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={{ padding: 8, width: 280, fontFamily: "monospace" }}
        />
        <button
          type="button"
          onClick={runTest}
          disabled={loading}
          style={{ padding: "8px 16px", cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Running…" : "Run Spec Engine"}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee", color: "#c00", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ border: "1px solid #ccc", padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Output</h2>
          {result.errors.length > 0 && (
            <div style={{ color: "#c60", marginBottom: 12 }}>
              Warnings: {result.errors.join("; ")}
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Item</th>
                <th style={{ textAlign: "right", padding: 8 }}>FWX Spec</th>
                <th style={{ textAlign: "right", padding: 8 }}>Industry</th>
                <th style={{ textAlign: "left", padding: 8 }}>Unit</th>
                <th style={{ textAlign: "right", padding: 8 }}>Chafers</th>
                <th style={{ textAlign: "right", padding: 8 }}>Pans</th>
                <th style={{ textAlign: "left", padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((r) => (
                <tr key={r.itemId} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: 8 }}>{r.itemName}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.fwxSpecValue}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.industryValue}</td>
                  <td style={{ padding: 8 }}>{r.unitType}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.chaferCount}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.panCount ?? "—"}</td>
                  <td style={{ padding: 8, fontSize: 11, color: "#555" }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 8, background: "#f5f5f5", fontSize: 12 }}>
            <strong>Pack-Out totals:</strong>{" "}
            {result.items.filter((i) => i.chaferCount > 0).length} items with chafers,{" "}
            {result.items.reduce((s, i) => s + i.chaferCount, 0)} total chafers
          </div>
        </div>
      )}
    </div>
  );
}
