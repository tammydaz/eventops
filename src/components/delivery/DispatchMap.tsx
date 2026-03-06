import React, { useState, useEffect, useCallback } from "react";
import { useJsApiLoader, GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";

export type DispatchMapItem = {
  id: string;
  eventName: string;
  jobNumber: string;
  venue: string;
  venueAddress: string;
  dispatchTime: string;
  assignedVehicle: string;
  type: "delivery" | "pickup" | "full-service";
  seq: number;
};

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim() || "";
const DEFAULT_CENTER = { lat: 39.8283, lng: -75.0152 }; // South Jersey area
const MAP_CONTAINER_STYLE = { width: "100%", height: "400px", borderRadius: 8 };
const KITCHEN_ADDRESS = (import.meta.env.VITE_KITCHEN_ADDRESS as string)?.trim() || "Hammonton, NJ";

/** Only render map when API key exists to avoid loader errors */
export function DispatchMap(props: { dispatches: DispatchMapItem[] }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        style={{
          ...MAP_CONTAINER_STYLE,
          background: "#0d1b2a",
          border: "2px solid #00e5ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          fontSize: 13,
        }}
      >
        Add VITE_GOOGLE_MAPS_API_KEY to .env to show delivery map
      </div>
    );
  }
  return <DispatchMapInner {...props} />;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY || !address?.trim()) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

function DispatchMapInner({ dispatches }: { dispatches: DispatchMapItem[] }) {
  const [markers, setMarkers] = useState<Array<DispatchMapItem & { lat: number; lng: number }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const geocodeAll = useCallback(async () => {
    const results: Array<DispatchMapItem & { lat: number; lng: number }> = [];
    for (const d of dispatches) {
      const addr = d.type === "pickup" && d.venue?.toLowerCase().includes("kitchen")
        ? KITCHEN_ADDRESS
        : d.venueAddress || `${d.venue}`;
      if (!addr || addr === "—") continue;
      const coords = await geocodeAddress(addr);
      if (coords) results.push({ ...d, ...coords });
    }
    setMarkers(results);
  }, [dispatches]);

  useEffect(() => {
    if (dispatches.length > 0) geocodeAll();
  }, [dispatches, geocodeAll]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  useEffect(() => {
    if (!mapRef || markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    mapRef.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [mapRef, markers]);

  if (loadError) {
    return (
      <div
        style={{
          ...MAP_CONTAINER_STYLE,
          background: "#0d1b2a",
          border: "2px solid #ff6b6b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff6b6b",
          fontSize: 13,
        }}
      >
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          ...MAP_CONTAINER_STYLE,
          background: "#0d1b2a",
          border: "2px solid #00e5ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00e5ff",
          fontSize: 13,
        }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={10}
        onLoad={onMapLoad}
        options={{
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {markers.map((m) => (
          <React.Fragment key={m.id}>
            <MarkerF
              position={{ lat: m.lat, lng: m.lng }}
              label={{
                text: String(m.seq),
                color: "#000",
                fontWeight: "bold",
              }}
              onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
            />
            {selectedId === m.id && (
              <InfoWindowF
                position={{ lat: m.lat, lng: m.lng }}
                onCloseClick={() => setSelectedId(null)}
              >
                <div style={{ padding: 8, minWidth: 180, color: "#333" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    Job #{m.seq} · {m.dispatchTime}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{m.eventName}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{m.venue}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{m.assignedVehicle}</div>
                </div>
              </InfoWindowF>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
}
