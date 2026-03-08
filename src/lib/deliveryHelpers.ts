/**
 * Check if event type is delivery or pickup (disposable, no on-site serviceware).
 */
export function isDeliveryOrPickup(eventType: string | undefined | null): boolean {
  if (!eventType || typeof eventType !== "string") return false;
  const lower = eventType.toLowerCase();
  return (
    lower.includes("delivery") ||
    lower.includes("pickup") ||
    lower.includes("pick up") ||
    lower.includes("pick-up") ||
    lower.includes("drop off") ||
    lower.includes("dropoff")
  );
}

/** Check if event type is delivery (we deliver to client). */
export function isDelivery(eventType: string | undefined | null): boolean {
  if (!eventType || typeof eventType !== "string") return false;
  const lower = eventType.toLowerCase();
  return lower.includes("delivery") || lower.includes("drop off") || lower.includes("dropoff");
}

/** Check if event type is pickup (client picks up at kitchen). */
export function isPickup(eventType: string | undefined | null): boolean {
  if (!eventType || typeof eventType !== "string") return false;
  const lower = eventType.toLowerCase();
  return lower.includes("pickup") || lower.includes("pick up") || lower.includes("pick-up");
}
