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
