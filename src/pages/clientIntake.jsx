import { useEffect, useState } from "react";
import { listEvents } from "../airtable";

export default function ClientIntake() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await listEvents();
      console.log("FULL EVENT DATA:", data);
      setEvents(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>RAW EVENT DATA DUMP</h1>

      {events.length === 0 && <p>No events returned.</p>}

      {events.map((ev, i) => (
        <div 
          key={i} 
          style={{ 
            border: "2px solid red", 
            margin: "10px 0", 
            padding: "10px",
            background: "black",
            color: "white"
          }}
        >
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(ev, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
