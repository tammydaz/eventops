import React, { useState, useEffect, useCallback } from "react";

const FLEET_STORAGE_KEY = "ops-chief-fleet-storage";

type TruckLogEntry = {
  id: string;
  date: string;
  vehicle: string;
  type: "gas" | "maintenance" | "detail";
  notes: string;
};

type FleetData = {
  truckLog: TruckLogEntry[];
  trailerMaterials: string[];
  trailerIdeas: string[];
  storageUnitContents: string;
  boxTruckContents: string;
};

const defaultData: FleetData = {
  truckLog: [],
  trailerMaterials: [],
  trailerIdeas: [],
  storageUnitContents: "",
  boxTruckContents: "",
};

function loadFleetData(): FleetData {
  try {
    const raw = localStorage.getItem(FLEET_STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as FleetData;
    return {
      truckLog: Array.isArray(parsed.truckLog) ? parsed.truckLog : defaultData.truckLog,
      trailerMaterials: Array.isArray(parsed.trailerMaterials) ? parsed.trailerMaterials : defaultData.trailerMaterials,
      trailerIdeas: Array.isArray(parsed.trailerIdeas) ? parsed.trailerIdeas : defaultData.trailerIdeas,
      storageUnitContents: typeof parsed.storageUnitContents === "string" ? parsed.storageUnitContents : defaultData.storageUnitContents,
      boxTruckContents: typeof parsed.boxTruckContents === "string" ? parsed.boxTruckContents : defaultData.boxTruckContents,
    };
  } catch {
    return defaultData;
  }
}

function saveFleetData(data: FleetData) {
  try {
    localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(59, 130, 246, 0.02))",
    border: "1px solid rgba(59, 130, 246, 0.25)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  title: { fontSize: "18px", fontWeight: 700, margin: "0 0 16px 0", color: "#e0e0e0" },
  subTitle: { fontSize: "14px", fontWeight: 600, color: "#94a3b8", marginBottom: "10px" },
  input: {
    width: "100%",
    maxWidth: "400px",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
    marginBottom: "8px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    maxWidth: "600px",
    minHeight: "80px",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#1e1e1e",
    color: "#e0e0e0",
    resize: "vertical",
    marginBottom: "8px",
    boxSizing: "border-box",
  },
  btn: {
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 600,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "8px",
    marginBottom: "8px",
  },
  btnSmall: { padding: "4px 10px", fontSize: "12px" },
  list: { listStyle: "none", padding: 0, margin: "8px 0 0 0" },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    borderBottom: "1px solid #2a2a2a",
    fontSize: "13px",
    color: "#e0e0e0",
  },
  logRow: {
    display: "grid",
    gridTemplateColumns: "100px 120px 100px 1fr auto",
    gap: "8px",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #2a2a2a",
    fontSize: "13px",
  },
  block: { marginBottom: "24px" },
};

type ViewMode = "all" | "fleet" | "inventory";

export function OpsChiefFleetAndStorage({ mode = "all" }: { mode?: ViewMode }) {
  const [data, setData] = useState<FleetData>(defaultData);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicle, setVehicle] = useState("");
  const [logType, setLogType] = useState<TruckLogEntry["type"]>("gas");
  const [logNotes, setLogNotes] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newIdea, setNewIdea] = useState("");

  useEffect(() => {
    setData(loadFleetData());
  }, []);

  const persist = useCallback((next: FleetData) => {
    setData(next);
    saveFleetData(next);
  }, []);

  const addTruckLog = () => {
    persist({
      ...data,
      truckLog: [
        { id: crypto.randomUUID?.() ?? String(Date.now()), date: logDate, vehicle: vehicle || "Truck", type: logType, notes: logNotes },
        ...data.truckLog,
      ],
    });
    setVehicle("");
    setLogNotes("");
  };

  const removeTruckLog = (id: string) => {
    persist({ ...data, truckLog: data.truckLog.filter((e) => e.id !== id) });
  };

  const addTrailerMaterial = () => {
    if (!newMaterial.trim()) return;
    persist({ ...data, trailerMaterials: [...data.trailerMaterials, newMaterial.trim()] });
    setNewMaterial("");
  };

  const removeTrailerMaterial = (index: number) => {
    persist({ ...data, trailerMaterials: data.trailerMaterials.filter((_, i) => i !== index) });
  };

  const addTrailerIdea = () => {
    if (!newIdea.trim()) return;
    persist({ ...data, trailerIdeas: [...data.trailerIdeas, newIdea.trim()] });
    setNewIdea("");
  };

  const removeTrailerIdea = (index: number) => {
    persist({ ...data, trailerIdeas: data.trailerIdeas.filter((_, i) => i !== index) });
  };

  const showFleet = mode === "all" || mode === "fleet";
  const showInventory = mode === "all" || mode === "inventory";

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>
        {mode === "fleet" ? "🚚 Fleet Management" : mode === "inventory" ? "📦 Inventory" : "🚚 Fleet & Equipment"}
      </h2>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
        {mode === "fleet" && "Trucks: gas, maintenance, detailing · Trailer: materials & ideas"}
        {mode === "inventory" && "What’s stored where: storage unit · box truck"}
        {mode === "all" && "Maintenance, gas, detailing · Trailer customization · Storage unit & box truck contents"}
      </p>

      {showFleet && (
      <div style={styles.block}>
        <div style={styles.subTitle}>Trucks — Gas, maintenance, detailing log</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            style={{ ...styles.input, width: "140px", maxWidth: "none" }}
          />
          <input
            type="text"
            placeholder="Vehicle name"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            style={{ ...styles.input, width: "140px", maxWidth: "none" }}
          />
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value as TruckLogEntry["type"])}
            style={{ ...styles.input, width: "140px", maxWidth: "none" }}
          >
            <option value="gas">Gas</option>
            <option value="maintenance">Maintenance</option>
            <option value="detail">Detailed</option>
          </select>
          <input
            type="text"
            placeholder="Notes"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            style={{ ...styles.input, width: "200px", maxWidth: "none" }}
          />
          <button type="button" onClick={addTruckLog} style={styles.btn}>
            Add log entry
          </button>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
          Most recent first. Set the date when the gas/maintenance/detail happened.
        </div>
        {data.truckLog.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ ...styles.logRow, color: "#64748b", fontWeight: 600 }}>
              <span>Date</span>
              <span>Vehicle</span>
              <span>Type</span>
              <span>Notes</span>
              <span />
            </div>
            {data.truckLog.map((entry) => (
              <div key={entry.id} style={styles.logRow}>
                <span>{entry.date}</span>
                <span>{entry.vehicle}</span>
                <span>{entry.type}</span>
                <span>{entry.notes}</span>
                <button type="button" onClick={() => removeTruckLog(entry.id)} style={{ ...styles.btn, ...styles.btnSmall }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {showFleet && (
      <div style={styles.block}>
        <div style={styles.subTitle}>New trailer — Materials to get & ideas</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Material or supply to get"
            value={newMaterial}
            onChange={(e) => setNewMaterial(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTrailerMaterial()}
            style={styles.input}
          />
          <button type="button" onClick={addTrailerMaterial} style={styles.btn}>Add material</button>
        </div>
        {data.trailerMaterials.length > 0 && (
          <ul style={styles.list}>
            {data.trailerMaterials.map((m, i) => (
              <li key={i} style={styles.listItem}>
                {m}
                <button type="button" onClick={() => removeTrailerMaterial(i)} style={{ ...styles.btn, ...styles.btnSmall }}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px", marginBottom: "8px" }}>
          <input
            type="text"
            placeholder="Idea to maximize storage / layout"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTrailerIdea()}
            style={styles.input}
          />
          <button type="button" onClick={addTrailerIdea} style={styles.btn}>Add idea</button>
        </div>
        {data.trailerIdeas.length > 0 && (
          <ul style={styles.list}>
            {data.trailerIdeas.map((idea, i) => (
              <li key={i} style={styles.listItem}>
                {idea}
                <button type="button" onClick={() => removeTrailerIdea(i)} style={{ ...styles.btn, ...styles.btnSmall }}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {showInventory && (
      <>
      <div style={styles.block}>
        <div style={styles.subTitle}>Storage unit — What’s in there</div>
        <textarea
          placeholder="List or describe what’s in the storage unit..."
          value={data.storageUnitContents}
          onChange={(e) => persist({ ...data, storageUnitContents: e.target.value })}
          style={styles.textarea}
        />
      </div>
      <div style={styles.block}>
        <div style={styles.subTitle}>Box truck (storage use)</div>
        <textarea
          placeholder="What’s currently stored in the box truck..."
          value={data.boxTruckContents}
          onChange={(e) => persist({ ...data, boxTruckContents: e.target.value })}
          style={styles.textarea}
        />
      </div>
      </>
      )}
    </section>
  );
}
