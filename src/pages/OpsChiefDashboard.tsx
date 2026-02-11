import React, { useState } from "react";
import { Link } from "react-router-dom";

type Event = {
  id: string;
  name: string;
  date: string;
  client: string;
  venue: string;
  daysUntil: number;
  dispatchTime?: string;
  // Critical Alert Triggers
  specialHandling?: string;
  sushiRequired?: boolean;
  sushiPickupConfirmed?: boolean;
  dessertPickupRequired?: boolean;
  dessertPickupConfirmed?: boolean;
  outsideVendorPickup?: boolean;
  outsideVendorConfirmed?: boolean;
  foodMustGoHot?: boolean;
  kitchenHotHoldConfirmed?: boolean;
  beoFinalized?: boolean;
  packOutComplete?: boolean;
  // Time-Sensitive Warnings
  kitchenNotes?: string;
  opsAcknowledged?: boolean;
  barInventoryRisk?: boolean;
  // Confirmation Checklist
  kitchenConfirmed?: boolean;
  pickupsConfirmed?: boolean;
  dispatchTimingConfirmed?: boolean;
};

type Alert = {
  type: string;
  icon: string;
  text: string;
  color: string;
  eventId: string;
  eventName: string;
};

type ResolutionPanel = {
  isOpen: boolean;
  alert: Alert | null;
  event: Event | null;
};

// Mock Events Data
const mockEvents: Event[] = [
  {
    id: "evt-1",
    name: "Holloway Wedding Reception",
    date: "Saturday, Feb 15 • 6:00 PM",
    client: "Mia Holloway",
    venue: "Magnolia Estate",
    daysUntil: 2,
    dispatchTime: "5:30 PM",
    specialHandling: "Food must go hot - client temperature sensitive",
    foodMustGoHot: true,
    kitchenHotHoldConfirmed: false,
    beoFinalized: true,
    packOutComplete: false,
    kitchenConfirmed: true,
    pickupsConfirmed: false,
    dispatchTimingConfirmed: false,
  },
  {
    id: "evt-2",
    name: "Corporate Summit Dinner",
    date: "Thursday, Feb 13 • 7:30 PM",
    client: "Laurel Tech",
    venue: "Harbor Hall",
    daysUntil: 0,
    dispatchTime: "6:30 PM",
    sushiRequired: true,
    sushiPickupConfirmed: false,
    beoFinalized: true,
    packOutComplete: true,
    kitchenConfirmed: true,
    pickupsConfirmed: false,
    dispatchTimingConfirmed: true,
  },
  {
    id: "evt-3",
    name: "Anniversary Celebration",
    date: "Friday, Feb 14 • 8:00 PM",
    client: "Donovan Family",
    venue: "Skyline Terrace",
    daysUntil: 1,
    dispatchTime: "7:00 PM",
    kitchenNotes: "Added extra vegan options - need confirmation",
    opsAcknowledged: false,
    beoFinalized: true,
    packOutComplete: true,
    kitchenConfirmed: true,
    pickupsConfirmed: true,
    dispatchTimingConfirmed: true,
  },
  {
    id: "evt-4",
    name: "Bridal Shower Brunch",
    date: "Sunday, Feb 16 • 11:00 AM",
    client: "Ava Daniels",
    venue: "Rosewood Loft",
    daysUntil: 3,
    dispatchTime: "10:00 AM",
    dessertPickupRequired: true,
    dessertPickupConfirmed: false,
    barInventoryRisk: true,
    beoFinalized: false,
    packOutComplete: false,
    kitchenConfirmed: false,
    pickupsConfirmed: false,
    dispatchTimingConfirmed: false,
  },
];

// Mock staff for assignments
const mockStaff = [
  "Marcus T.",
  "Sarah L.",
  "James K.",
  "Mike R.",
  "Lisa S."
];

const OpsChiefDashboard = () => {
  const [resolutionPanel, setResolutionPanel] = useState<ResolutionPanel>({
    isOpen: false,
    alert: null,
    event: null,
  });
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [opsNotes, setOpsNotes] = useState<string>("");
  const [resolutionStatus, setResolutionStatus] = useState<string>("");

  // Calculate critical alerts for each event
  const getCriticalAlerts = (event: Event) => {
    const alerts = [];
    
    if (event.specialHandling) {
      alerts.push({
        type: 'special-handling',
        icon: '⚠️',
        text: 'Special handling required — review notes',
        color: '#ff3333'
      });
    }
    
    if ((event.sushiRequired && !event.sushiPickupConfirmed) || 
        (event.dessertPickupRequired && !event.dessertPickupConfirmed) ||
        (event.outsideVendorPickup && !event.outsideVendorConfirmed)) {
      alerts.push({
        type: 'pickup',
        icon: '🚚',
        text: 'Pickup not confirmed',
        color: '#ff3333'
      });
    }
    
    if (event.foodMustGoHot && !event.kitchenHotHoldConfirmed) {
      alerts.push({
        type: 'hot-hold',
        icon: '🔥',
        text: 'Food must go hot — not confirmed',
        color: '#ff3333'
      });
    }
    
    if (event.beoFinalized && !event.packOutComplete) {
      alerts.push({
        type: 'pack-out',
        icon: '📦',
        text: 'Pack-out not confirmed',
        color: '#ff3333'
      });
    }
    
    return alerts;
  };

  // Calculate time-sensitive warnings
  const getTimeSensitiveWarnings = (event: Event) => {
    const warnings = [];
    
    if (event.daysUntil <= 5 && event.daysUntil >= 0) {
      const hasOpenOpsItems = !event.kitchenConfirmed || !event.packOutComplete || !event.pickupsConfirmed || !event.dispatchTimingConfirmed;
      if (hasOpenOpsItems) {
        warnings.push({
          type: 'approaching',
          icon: '⏳',
          text: `Event approaching — ops items still open (${event.daysUntil} days)`,
          color: '#ffc107'
        });
      }
    }
    
    if (event.kitchenNotes && !event.opsAcknowledged) {
      warnings.push({
        type: 'kitchen-notes',
        icon: '🧑‍🍳',
        text: 'Kitchen note requires review',
        color: '#ffc107'
      });
    }
    
    if (event.barInventoryRisk) {
      warnings.push({
        type: 'bar-risk',
        icon: '🍸',
        text: 'Bar setup risk',
        color: '#ffc107'
      });
    }
    
    return warnings;
  };

  // Handle "FIX NOW" click
  const handleFixNow = (alert: Alert) => {
    const event = mockEvents.find(e => e.id === alert.eventId);
    setResolutionPanel({
      isOpen: true,
      alert,
      event: event || null,
    });
    setSelectedStaff("");
    setOpsNotes("");
    setResolutionStatus("");
  };

  // Handle resolution actions
  const handleConfirm = () => {
    // In real app, this would update the event data
    setResolutionStatus("confirmed");
    setTimeout(() => {
      setResolutionPanel({ isOpen: false, alert: null, event: null });
    }, 1500);
  };

  const handleAssign = () => {
    if (!selectedStaff) return;
    // In real app, this would assign and update the event data
    setResolutionStatus("assigned");
    setTimeout(() => {
      setResolutionPanel({ isOpen: false, alert: null, event: null });
    }, 1500);
  };

  const handleAcknowledge = () => {
    // In real app, this would acknowledge the warning
    setResolutionStatus("acknowledged");
    setTimeout(() => {
      setResolutionPanel({ isOpen: false, alert: null, event: null });
    }, 1500);
  };

  const closePanel = () => {
    setResolutionPanel({ isOpen: false, alert: null, event: null });
  };

  // Get problem statement and source data based on alert type
  const getProblemDetails = (alert: Alert, event: Event | null) => {
    if (!event) return { statement: "", sourceData: [] };

    switch (alert.type) {
      case 'special-handling':
        return {
          statement: "This event includes special handling outside the normal workflow. Review and confirm required actions.",
          sourceData: [
            { label: "Exceptions / Special Handling", value: event.specialHandling || "" }
          ]
        };
      
      case 'pickup':
        const pickupTypes = [];
        if (event.sushiRequired) pickupTypes.push("Sushi");
        if (event.dessertPickupRequired) pickupTypes.push("Dessert");
        if (event.outsideVendorPickup) pickupTypes.push("Outside Vendor");
        return {
          statement: "One or more pickups are required for this event and have not been confirmed.",
          sourceData: [
            { label: "Pickup Type(s)", value: pickupTypes.join(", ") },
            { label: "Confirmation Status", value: "Not Confirmed" }
          ]
        };
      
      case 'hot-hold':
        return {
          statement: "Food is required to remain hot through service, but kitchen confirmation is missing.",
          sourceData: [
            { label: "Food Must Go Hot", value: "YES" },
            { label: "Kitchen Hot Hold Confirmed", value: "NO" }
          ]
        };
      
      case 'pack-out':
        return {
          statement: "BEO is finalized but pack-out has not been confirmed. Equipment, bar, and flair need verification.",
          sourceData: [
            { label: "BEO Finalized", value: "YES" },
            { label: "Pack-Out Complete", value: "NO" }
          ]
        };
      
      default:
        return { statement: "", sourceData: [] };
    }
  };

  // Get all critical alerts across all events
  const allCriticalAlerts = mockEvents.flatMap(event => 
    getCriticalAlerts(event).map(alert => ({ ...alert, eventId: event.id, eventName: event.name }))
  );

  // Get all time-sensitive warnings across all events
  const allWarnings = mockEvents.flatMap(event => 
    getTimeSensitiveWarnings(event).map(warning => ({ ...warning, eventId: event.id, eventName: event.name }))
  );

  return (
    <div style={styles.container}>
      {/* Background overlay */}
      <div style={styles.backgroundOverlay} />

      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.backButton}>
          <div style={styles.logoSquare}>
            <span style={styles.logoLetter}>F</span>
          </div>
          <span style={styles.backText}>Back to Dashboard</span>
        </Link>

        <div style={styles.headerCenter}>
          <h1 style={styles.title}>MATT'S DASHBOARD</h1>
          <p style={styles.subtitle}>OPS CHIEF / EXPEDITER VIEW • CATCH WHAT BREAKS EVENTS</p>
        </div>
      </header>

      {/* Main Content - 3 Zones */}
      <main style={styles.main}>
        
        {/* Zone 1: Critical Alerts (RED) */}
        <section style={styles.criticalAlertsZone}>
          <div style={styles.zoneHeader}>
            <h2 style={styles.zoneTitle}>🔴 CRITICAL ALERTS</h2>
            <span style={styles.zoneSubtitle}>BLOCKING ISSUES • EVENT IS NOT SAFE</span>
          </div>
          
          {allCriticalAlerts.length === 0 ? (
            <div style={styles.allClear}>
              <div style={styles.allClearIcon}>✅</div>
              <div style={styles.allClearText}>ALL CLEAR - No blocking issues</div>
            </div>
          ) : (
            <div style={styles.alertsGrid}>
              {allCriticalAlerts.map((alert, index) => (
                <div key={`${alert.eventId}-${index}`} style={styles.criticalAlert}>
                  <div style={styles.alertHeader}>
                    <span style={styles.alertIcon}>{alert.icon}</span>
                    <span style={styles.alertText}>{alert.text}</span>
                  </div>
                  <div style={styles.alertEvent}>{alert.eventName}</div>
                  <button style={styles.alertAction} onClick={() => handleFixNow(alert)}>
                    FIX NOW →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zone 2: Time-Sensitive Warnings (YELLOW) */}
        <section style={styles.warningsZone}>
          <div style={styles.zoneHeader}>
            <h2 style={styles.zoneTitle}>🟡 TIME-SENSITIVE WARNINGS</h2>
            <span style={styles.zoneSubtitle}>DON'T PROCRASTINATE • WILL BLOCK SOON</span>
          </div>
          
          {allWarnings.length === 0 ? (
            <div style={styles.allClear}>
              <div style={styles.allClearIcon}>✅</div>
              <div style={styles.allClearText}>NO WARNINGS - Timeline is clear</div>
            </div>
          ) : (
            <div style={styles.warningsGrid}>
              {allWarnings.map((warning, index) => (
                <div key={`${warning.eventId}-${index}`} style={styles.warningAlert}>
                  <div style={styles.alertHeader}>
                    <span style={styles.alertIcon}>{warning.icon}</span>
                    <span style={styles.alertText}>{warning.text}</span>
                  </div>
                  <div style={styles.alertEvent}>{warning.eventName}</div>
                  <button style={styles.warningAction} onClick={() => handleFixNow(warning)}>
                    REVIEW →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zone 3: Confirmation Checklist */}
        <section style={styles.checklistZone}>
          <div style={styles.zoneHeader}>
            <h2 style={styles.zoneTitle}>✅ CONFIRMATION CHECKLIST</h2>
            <span style={styles.zoneSubtitle}>CONFIDENCE CHECKLIST • NOT A TASK LIST</span>
          </div>
          
          <div style={styles.eventsChecklist}>
            {mockEvents.map(event => {
              const criticalAlerts = getCriticalAlerts(event);
              const warnings = getTimeSensitiveWarnings(event);
              
              return (
                <div key={event.id} style={styles.eventChecklist}>
                  <div style={styles.eventChecklistHeader}>
                    <h3 style={styles.eventChecklistName}>{event.name}</h3>
                    <span style={styles.eventChecklistDate}>{event.date}</span>
                  </div>
                  
                  <div style={styles.checklistItems}>
                    <div style={styles.checklistItem}>
                      <span style={styles.checklistIcon}>
                        {event.beoFinalized ? '✅' : '⭕'}
                      </span>
                      <span style={styles.checklistLabel}>BEO Finalized</span>
                    </div>
                    
                    <div style={styles.checklistItem}>
                      <span style={styles.checklistIcon}>
                        {event.kitchenConfirmed ? '✅' : '⭕'}
                      </span>
                      <span style={styles.checklistLabel}>Kitchen Confirmed</span>
                    </div>
                    
                    <div style={styles.checklistItem}>
                      <span style={styles.checklistIcon}>
                        {event.packOutComplete ? '✅' : '⭕'}
                      </span>
                      <span style={styles.checklistLabel}>Pack-Out Confirmed</span>
                    </div>
                    
                    <div style={styles.checklistItem}>
                      <span style={styles.checklistIcon}>
                        {event.pickupsConfirmed ? '✅' : '⭕'}
                      </span>
                      <span style={styles.checklistLabel}>Pickups Confirmed</span>
                    </div>
                    
                    <div style={styles.checklistItem}>
                      <span style={styles.checklistIcon}>
                        {event.dispatchTimingConfirmed ? '✅' : '⭕'}
                      </span>
                      <span style={styles.checklistLabel}>Dispatch Timing Confirmed</span>
                    </div>
                  </div>
                  
                  {(criticalAlerts.length > 0 || warnings.length > 0) && (
                    <div style={styles.eventStatus}>
                      {criticalAlerts.length > 0 && (
                        <span style={styles.eventStatusCritical}>
                          {criticalAlerts.length} CRITICAL
                        </span>
                      )}
                      {warnings.length > 0 && (
                        <span style={styles.eventStatusWarning}>
                          {warnings.length} WARNING
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Ops Resolution Panel */}
      {resolutionPanel.isOpen && resolutionPanel.alert && resolutionPanel.event && (
        <div style={styles.panelOverlay}>
          <div style={styles.resolutionPanel}>
            {/* Header - Context Lock */}
            <div style={styles.panelHeader}>
              <div style={styles.panelContext}>
                <div style={styles.panelAlert}>
                  <span style={styles.panelAlertIcon}>{resolutionPanel.alert.icon}</span>
                  <span style={styles.panelAlertText}>{resolutionPanel.alert.text}</span>
                </div>
                <h2 style={styles.panelEventName}>{resolutionPanel.event.name}</h2>
                <p style={styles.panelEventDetails}>
                  {resolutionPanel.event.date} · {resolutionPanel.event.venue} · Dispatch {resolutionPanel.event.dispatchTime}
                </p>
              </div>
              <button style={styles.panelClose} onClick={closePanel}>×</button>
            </div>

            {/* Resolution Content */}
            <div style={styles.panelContent}>
              {resolutionStatus ? (
                /* Resolution Summary */
                <div style={styles.resolutionSummary}>
                  <div style={styles.resolutionSuccessIcon}>✅</div>
                  <div style={styles.resolutionSuccessText}>
                    {resolutionStatus === 'confirmed' && 'Issue confirmed and resolved'}
                    {resolutionStatus === 'assigned' && `Assigned to ${selectedStaff} and confirmed`}
                    {resolutionStatus === 'acknowledged' && 'Acknowledged — reviewed'}
                  </div>
                  <div style={styles.resolutionTimestamp}>Today {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              ) : (
                <>
                  {/* Problem Statement */}
                  <div style={styles.panelSection}>
                    <h3 style={styles.panelSectionTitle}>Problem Statement</h3>
                    <p style={styles.problemStatement}>
                      {getProblemDetails(resolutionPanel.alert, resolutionPanel.event).statement}
                    </p>
                  </div>

                  {/* Source Data */}
                  <div style={styles.panelSection}>
                    <h3 style={styles.panelSectionTitle}>Source Data</h3>
                    <div style={styles.sourceData}>
                      {getProblemDetails(resolutionPanel.alert, resolutionPanel.event).sourceData.map((data, index) => (
                        <div key={index} style={styles.sourceDataRow}>
                          <span style={styles.dataLabel}>{data.label}:</span>
                          <span style={styles.dataValue}>{data.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Actions */}
                  <div style={styles.panelSection}>
                    <h3 style={styles.panelSectionTitle}>Required Actions</h3>
                    
                    {resolutionPanel.alert.type === 'pickup' && (
                      <div style={styles.actionSection}>
                        <div style={styles.assignSection}>
                          <label style={styles.assignLabel}>Assign pickup to:</label>
                          <select 
                            style={styles.staffSelect}
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                          >
                            <option value="">Select staff...</option>
                            {mockStaff.map(staff => (
                              <option key={staff} value={staff}>{staff}</option>
                            ))}
                          </select>
                          <button 
                            style={styles.assignButton}
                            onClick={handleAssign}
                            disabled={!selectedStaff}
                          >
                            Assign & Confirm
                          </button>
                        </div>
                      </div>
                    )}

                    {(resolutionPanel.alert.type === 'hot-hold' || resolutionPanel.alert.type === 'pack-out') && (
                      <div style={styles.actionSection}>
                        <button style={styles.confirmButton} onClick={handleConfirm}>
                          ✅ Confirmed
                        </button>
                        <p style={styles.actionHelp}>
                          This will mark the item as confirmed and clear the alert.
                        </p>
                      </div>
                    )}

                    {resolutionPanel.alert.type === 'special-handling' && (
                      <div style={styles.actionSection}>
                        <button style={styles.confirmButton} onClick={handleConfirm}>
                          ✅ Reviewed & Acknowledged
                        </button>
                        <p style={styles.actionHelp}>
                          Acknowledge that you've reviewed the special handling requirements.
                        </p>
                      </div>
                    )}

                    {resolutionPanel.alert.type === 'kitchen-notes' && (
                      <div style={styles.actionSection}>
                        <button style={styles.acknowledgeButton} onClick={handleAcknowledge}>
                          Acknowledge — reviewed
                        </button>
                        <p style={styles.actionHelp}>
                          This clears the warning and records that Ops has reviewed it.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional Notes */}
                  <div style={styles.panelSection}>
                    <h3 style={styles.panelSectionTitle}>Ops Notes (Optional)</h3>
                    <textarea
                      style={styles.notesTextarea}
                      placeholder="Brief notes for audit trail (1-2 lines recommended)..."
                      value={opsNotes}
                      onChange={(e) => setOpsNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #0a1a0a 50%, #0f0a15 100%)",
    color: "#e0e0e0",
    position: "relative",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  backgroundOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(255, 51, 51, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 193, 7, 0.05) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    padding: "15px 20px",
    background: "linear-gradient(180deg, rgba(20, 10, 10, 0.8), rgba(15, 10, 15, 0.6))",
    borderBottom: "1px solid rgba(255, 51, 51, 0.15)",
    backdropFilter: "blur(10px)",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#a0a0a0",
    transition: "all 0.3s ease",
  },
  logoSquare: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #cc0000, #ff3333)",
    transform: "rotate(45deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    boxShadow: "0 0 20px rgba(204, 0, 0, 0.4)",
  },
  logoLetter: {
    transform: "rotate(-45deg)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "20px",
  },
  backText: {
    fontSize: "14px",
    fontWeight: "600",
  },
  headerCenter: {
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(18px, 5vw, 28px)",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "6px",
    textShadow: "-2px -2px 0 #ff3333, 2px -2px 0 #ff3333, -2px 2px 0 #ff3333, 2px 2px 0 #ff3333",
  },
  subtitle: {
    fontSize: "clamp(10px, 2.5vw, 12px)",
    color: "#ffc107",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase",
    textAlign: "center",
  },
  main: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "20px 15px",
    minHeight: "calc(100vh - 100px)",
  },
  criticalAlertsZone: {
    background: "linear-gradient(135deg, rgba(255, 51, 51, 0.1), rgba(255, 51, 51, 0.05))",
    border: "2px solid rgba(255, 51, 51, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(5px)",
  },
  warningsZone: {
    background: "linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))",
    border: "2px solid rgba(255, 193, 7, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(5px)",
  },
  checklistZone: {
    background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))",
    border: "2px solid rgba(76, 175, 80, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(5px)",
  },
  zoneHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
  },
  zoneTitle: {
    fontSize: "22px",
    fontWeight: "900",
    margin: 0,
  },
  zoneSubtitle: {
    fontSize: "12px",
    color: "#888",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  allClear: {
    textAlign: "center",
    padding: "40px",
    color: "#4caf50",
  },
  allClearIcon: {
    fontSize: "48px",
    marginBottom: "10px",
  },
  allClearText: {
    fontSize: "16px",
    fontWeight: "600",
  },
  alertsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "15px",
  },
  warningsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "15px",
  },
  criticalAlert: {
    background: "linear-gradient(135deg, rgba(255, 51, 51, 0.2), rgba(255, 51, 51, 0.1))",
    border: "2px solid #ff3333",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 0 20px rgba(255, 51, 51, 0.3)",
  },
  warningAlert: {
    background: "linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1))",
    border: "2px solid #ffc107",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 0 20px rgba(255, 193, 7, 0.3)",
  },
  alertHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  alertIcon: {
    fontSize: "20px",
  },
  alertText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
  },
  alertEvent: {
    fontSize: "12px",
    color: "#888",
    marginBottom: "10px",
  },
  alertAction: {
    background: "#ff3333",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  warningAction: {
    background: "#ffc107",
    border: "none",
    borderRadius: "6px",
    color: "#000",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  eventsChecklist: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "20px",
  },
  eventChecklist: {
    background: "linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.6))",
    border: "2px solid rgba(76, 175, 80, 0.3)",
    borderRadius: "8px",
    padding: "20px",
    backdropFilter: "blur(5px)",
  },
  eventChecklistHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  eventChecklistName: {
    fontSize: "16px",
    fontWeight: "900",
    color: "#fff",
    margin: 0,
  },
  eventChecklistDate: {
    fontSize: "12px",
    color: "#888",
    fontWeight: "600",
  },
  checklistItems: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "15px",
  },
  checklistItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checklistIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center",
  },
  checklistLabel: {
    fontSize: "13px",
    color: "#ccc",
    fontWeight: "600",
  },
  eventStatus: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  eventStatusCritical: {
    background: "#ff3333",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
  },
  eventStatusWarning: {
    background: "#ffc107",
    color: "#000",
    fontSize: "10px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
  },
  // Ops Resolution Panel Styles
  panelOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  resolutionPanel: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
    border: "2px solid #333",
    borderRadius: "12px",
    width: "95%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "15px",
    borderBottom: "1px solid #333",
    flexWrap: "wrap",
    gap: "10px",
  },
  panelContext: {
    flex: 1,
  },
  panelAlert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  panelAlertIcon: {
    fontSize: "20px",
  },
  panelAlertText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ff3333",
  },
  panelEventName: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#fff",
    margin: "0 0 4px 0",
  },
  panelEventDetails: {
    fontSize: "12px",
    color: "#888",
    margin: 0,
  },
  panelClose: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.3s ease",
  },
  panelContent: {
    padding: "15px",
  },
  panelSection: {
    marginBottom: "24px",
  },
  panelSectionTitle: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#fff",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  problemStatement: {
    fontSize: "14px",
    color: "#ccc",
    lineHeight: "1.4",
    margin: 0,
  },
  sourceData: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "12px",
  },
  sourceDataRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  dataLabel: {
    fontSize: "12px",
    color: "#888",
    fontWeight: "600",
  },
  dataValue: {
    fontSize: "12px",
    color: "#fff",
    fontWeight: "700",
  },
  actionSection: {
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "16px",
  },
  assignSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  assignLabel: {
    fontSize: "13px",
    color: "#ccc",
    fontWeight: "600",
  },
  staffSelect: {
    background: "#333",
    border: "1px solid #555",
    borderRadius: "4px",
    color: "#fff",
    padding: "8px 12px",
    fontSize: "13px",
  },
  assignButton: {
    background: "#ff3333",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  confirmButton: {
    background: "#4caf50",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  acknowledgeButton: {
    background: "#ffc107",
    border: "none",
    borderRadius: "6px",
    color: "#000",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  actionHelp: {
    fontSize: "11px",
    color: "#888",
    margin: "8px 0 0 0",
    fontStyle: "italic",
  },
  notesTextarea: {
    width: "100%",
    background: "#333",
    border: "1px solid #555",
    borderRadius: "6px",
    color: "#fff",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "50px",
  },
  resolutionSummary: {
    textAlign: "center",
    padding: "40px 20px",
  },
  resolutionSuccessIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  resolutionSuccessText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#4caf50",
    marginBottom: "8px",
  },
  resolutionTimestamp: {
    fontSize: "12px",
    color: "#888",
  },
};

export default OpsChiefDashboard;
