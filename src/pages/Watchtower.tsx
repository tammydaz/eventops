import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";

type EventListItem = {
  id: string;
  eventName: string;
  eventDate?: string;
  eventType?: string;
  serviceStyle?: string;
  guestCount?: number | string;
};

const Watchtower = () => {
  const { events, eventsLoading, setSelectedEventId } = useEventStore() as {
    events: EventListItem[];
    eventsLoading: boolean;
    setSelectedEventId: (id: string | null) => void;
  };

  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [lockedEventId, setLockedEventId] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (eventId: string) => {
    // Clear any existing hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Clear hide timeout if exists
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    // Only open panel if user hovers for 700ms (prevents accidental hovers while scrolling)
    const timeout = setTimeout(() => {
      if (!lockedEventId) {
        setHoveredEventId(eventId);
        setLockedEventId(eventId);
      }
    }, 700);
    setHoverTimeout(timeout);
  };

  const handleCardMouseLeave = () => {
    // Cancel pending hover
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // DON'T auto-close - let user move to panel
    // Panel will only close when they leave the panel itself
  };

  const keepPanelOpen = () => {
    // Cancel any pending close
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const closePanelDelayed = () => {
    // Close immediately when leaving the panel
    setHoveredEventId(null);
    setLockedEventId(null);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const closePanel = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    setHoveredEventId(null);
    setLockedEventId(null);
  };

  // Use locked event if available, otherwise use hovered
  const displayEventId = lockedEventId || hoveredEventId;

  // Filter events for current week
  const currentWeekEvents = useMemo(() => {
    if (showAllEvents) return events;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return events.filter((evt) => {
      if (!evt.eventDate) return true; // Show events without dates
      const eventDate = new Date(evt.eventDate);
      return eventDate >= startOfWeek && eventDate < endOfWeek;
    });
  }, [events, showAllEvents]);

  const handleEmailClient = (evt: EventListItem) => {
    // TODO: Integrate with email service
    alert(`Email client for: ${evt.eventName}`);
  };

  return (
    <div style={styles.container}>
      {/* Animated background */}
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
          <h1 style={styles.title}>Papa Chulo Watchtower</h1>
          <p style={styles.subtitle}>
            {showAllEvents ? "All Events" : "This Week's Events"} • Command Center
          </p>
        </div>

        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.filterToggle,
              ...(showAllEvents ? styles.filterToggleActive : {}),
            }}
            onClick={() => setShowAllEvents(!showAllEvents)}
          >
            <span style={styles.filterIcon}>{showAllEvents ? "📋" : "📅"}</span>
            <span style={styles.filterText}>
              {showAllEvents ? `All Events (${currentWeekEvents.length})` : `This Week (${currentWeekEvents.length})`}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {eventsLoading ? (
          <div style={styles.loading}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Loading events...</p>
          </div>
        ) : currentWeekEvents.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>
            <h3 style={styles.emptyTitle}>
              {showAllEvents ? "No Events Found" : "No Events This Week"}
            </h3>
            <p style={styles.emptyText}>
              {showAllEvents 
                ? "Create your first event to get started"
                : "Try viewing all events or create a new one"}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {!showAllEvents && (
                <button
                  onClick={() => setShowAllEvents(true)}
                  style={styles.emptyButton}
                >
                  View All Events
                </button>
              )}
              <Link to="/" style={styles.emptyButton}>
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div style={styles.eventsGrid}>
            {currentWeekEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  ...styles.eventCard,
                  ...(displayEventId === evt.id ? styles.eventCardHovered : {}),
                }}
                onMouseEnter={() => handleMouseEnter(evt.id)}
                onMouseLeave={handleCardMouseLeave}
              >
                {/* Silk napkin fold corners */}
                <div style={styles.foldTopLeft} />
                <div style={styles.foldTopRight} />

                {/* Card Content */}
                <div style={styles.eventCardHeader}>
                  <div style={styles.eventInfo}>
                    <h3 style={styles.eventName}>{evt.eventName}</h3>
                    <p style={styles.eventTime}>
                      {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Date TBD'}
                    </p>
                  </div>
                </div>

                <div style={styles.eventDetails}>
                  {evt.eventType && (
                    <div style={styles.eventDetailItem}>
                      <span style={styles.eventDetailLabel}>Type:</span>
                      <span style={styles.eventDetailValue}>{evt.eventType}</span>
                    </div>
                  )}
                  {evt.serviceStyle && (
                    <div style={styles.eventDetailItem}>
                      <span style={styles.eventDetailLabel}>Service:</span>
                      <span style={styles.eventDetailValue}>{evt.serviceStyle}</span>
                    </div>
                  )}
                  {evt.guestCount && (
                    <div style={styles.eventDetailItem}>
                      <span style={styles.eventDetailLabel}>Guests:</span>
                      <span style={styles.eventDetailValue}>{evt.guestCount}</span>
                    </div>
                  )}
                </div>

                {evt.eventType && (
                  <div style={styles.eventCategory}>{evt.eventType}</div>
                )}

                <div style={styles.healthLights}>
                  <div style={{ ...styles.healthLight, ...styles.healthLightGreen }} />
                  <span style={styles.healthLabel}>Status: Ready</span>
                </div>

                {/* Hover Side Panel - render outside card as fixed overlay */}
              </div>
            ))}
          </div>
        )}

        {/* Side Panel - Fixed position overlay */}
        {displayEventId && currentWeekEvents.find(e => e.id === displayEventId) && (
          <div 
            style={styles.sidePanel}
            onMouseEnter={keepPanelOpen}
            onMouseLeave={closePanelDelayed}
          >
            {(() => {
              const evt = currentWeekEvents.find(e => e.id === displayEventId)!;
              return (
                <>
                  <div style={styles.sidePanelHeader}>
                    <h4 style={styles.sidePanelTitle}>Quick Actions</h4>
                    <button
                      style={styles.sidePanelClose}
                      onClick={(e) => {
                        e.stopPropagation();
                        closePanel();
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={styles.sidePanelEventInfo}>
                    <h5 style={styles.sidePanelEventName}>{evt.eventName}</h5>
                    <p style={styles.sidePanelEventDate}>
                      {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Date TBD'}
                    </p>
                  </div>

                  <div style={styles.actionsList}>
                    <button
                      style={styles.actionItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmailClient(evt);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>📧</span>
                      <span style={styles.actionText}>Email Client</span>
                    </button>

                    <Link
                      to={`/profit/${evt.id}`}
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>💰</span>
                      <span style={styles.actionText}>Check Profit Margins</span>
                    </Link>

                    <Link
                      to={`/spec-engine/${evt.id}`}
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>📋</span>
                      <span style={styles.actionText}>Review/Spec BEO</span>
                    </Link>

                    <Link
                      to={`/beo-intake/${evt.id}`}
                      style={styles.actionItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(evt.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>✏️</span>
                      <span style={styles.actionText}>Edit Event (Full Intake)</span>
                    </Link>

                    <Link
                      to={`/beo-intake/${evt.id}`}
                      style={styles.actionItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(evt.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>📂</span>
                      <span style={styles.actionText}>Open Event</span>
                    </Link>

                    <Link
                      to={`/health/${evt.id}`}
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>🚦</span>
                      <span style={styles.actionText}>Check Health Light</span>
                    </Link>

                    <button
                      style={styles.actionItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`View QuickBooks invoice for: ${evt.eventName}`);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>💳</span>
                      <span style={styles.actionText}>View Invoice (QuickBooks)</span>
                    </button>

                    <Link
                      to="/delivery-command"
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>🚛</span>
                      <span style={styles.actionText}>Delivery & Dispatch Command</span>
                    </Link>

                    <Link
                      to="/returned-equipment"
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>📋</span>
                      <span style={styles.actionText}>Returned Equipment Tracker</span>
                    </Link>

                    <Link
                      to="/post-event-debrief"
                      style={styles.actionItem}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = styles.actionItemHover.background as string;
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = styles.actionItem.background as string;
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span style={styles.actionIcon}>📝</span>
                      <span style={styles.actionText}>Post-Event Debrief</span>
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
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
    background: "radial-gradient(circle at 20% 50%, rgba(204, 0, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(204, 0, 0, 0.05) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    background: "linear-gradient(180deg, rgba(20, 10, 10, 0.8), rgba(15, 10, 15, 0.6))",
    borderBottom: "1px solid rgba(204, 0, 0, 0.15)",
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
    fontSize: "28px",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "6px",
    textShadow: "-2px -2px 0 #00bcd4, 2px -2px 0 #00bcd4, -2px 2px 0 #00bcd4, 2px 2px 0 #00bcd4",
  },
  subtitle: {
    fontSize: "12px",
    color: "#cc0000",
    fontWeight: "600",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  filterToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "#a0a0a0",
    fontWeight: "700",
    fontSize: "13px",
  },
  filterToggleActive: {
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(0, 188, 212, 0.1))",
    border: "2px solid rgba(0, 188, 212, 0.4)",
    boxShadow: "0 0 15px rgba(0, 188, 212, 0.2)",
    color: "#00bcd4",
  },
  filterIcon: {
    fontSize: "18px",
  },
  filterText: {
    fontSize: "13px",
    fontWeight: "700",
  },
  main: {
    position: "relative",
    zIndex: 1,
    padding: "40px",
    minHeight: "calc(100vh - 100px)",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "4px solid rgba(204, 0, 0, 0.1)",
    borderTop: "4px solid #cc0000",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "20px",
    fontSize: "16px",
    color: "#888",
    fontWeight: "600",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  emptyIcon: {
    fontSize: "80px",
    marginBottom: "20px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#fff",
    marginBottom: "10px",
  },
  emptyText: {
    fontSize: "16px",
    color: "#888",
    marginBottom: "30px",
  },
  emptyButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #cc0000, #ff3333)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(204, 0, 0, 0.3)",
    transition: "all 0.3s ease",
  },
  eventsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "30px",
    position: "relative",
  },
  eventCard: {
    position: "relative",
    background: "linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))",
    border: "2px solid #00bcd4",
    borderRadius: "12px",
    padding: "24px",
    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    overflow: "visible",
    backdropFilter: "blur(5px)",
    cursor: "pointer",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 188, 212, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)",
    zIndex: 1,
  },
  eventCardHovered: {
    transform: "translateY(-12px) perspective(1000px) rotateX(2deg)",
    boxShadow: "0 25px 50px rgba(0, 188, 212, 0.35), 0 0 35px rgba(0, 188, 212, 0.35), inset -2px -2px 12px rgba(0, 0, 0, 0.3), inset 2px 2px 12px rgba(255, 255, 255, 0.08)",
    zIndex: 100,
    borderColor: "#4dd0e1",
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(0, 188, 212, 0.1))",
  },
  foldTopLeft: {
    content: "''",
    position: "absolute",
    top: "-8px",
    left: "20px",
    width: 0,
    height: 0,
    borderLeft: "15px solid transparent",
    borderRight: "0px solid transparent",
    borderTop: "15px solid rgba(0, 188, 212, 0.4)",
    opacity: 0,
    transition: "opacity 0.4s ease",
    zIndex: 10,
  },
  foldTopRight: {
    content: "''",
    position: "absolute",
    top: "-8px",
    right: "20px",
    width: 0,
    height: 0,
    borderRight: "15px solid transparent",
    borderLeft: "0px solid transparent",
    borderTop: "15px solid rgba(0, 188, 212, 0.4)",
    opacity: 0,
    transition: "opacity 0.4s ease",
    zIndex: 10,
  },
  eventCardHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "6px",
  },
  eventTime: {
    fontSize: "12px",
    color: "#cc0000",
    fontWeight: "600",
  },
  eventDetails: {
    marginBottom: "16px",
  },
  eventDetailItem: {
    fontSize: "13px",
    color: "#a0a0a0",
    marginBottom: "6px",
  },
  eventDetailLabel: {
    color: "#888",
    fontWeight: "600",
    marginRight: "6px",
  },
  eventDetailValue: {
    color: "#ffffff",
    fontWeight: "700",
  },
  eventCategory: {
    display: "inline-block",
    background: "linear-gradient(135deg, rgba(204, 0, 0, 0.2), rgba(204, 0, 0, 0.1))",
    color: "#ff9999",
    padding: "6px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    marginBottom: "16px",
    border: "1px solid rgba(204, 0, 0, 0.2)",
  },
  healthLights: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    paddingTop: "14px",
    borderTop: "1px solid rgba(204, 0, 0, 0.1)",
  },
  healthLight: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
  },
  healthLightGreen: {
    backgroundColor: "#4caf50",
    boxShadow: "0 0 10px rgba(76, 175, 80, 0.6)",
  },
  healthLabel: {
    fontSize: "11px",
    color: "#888",
    fontWeight: "600",
  },
  sidePanel: {
    position: "fixed",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    width: "280px",
    maxHeight: "80vh",
    overflowY: "auto",
    background: "linear-gradient(135deg, rgba(20, 8, 8, 0.98), rgba(15, 6, 12, 0.95))",
    border: "2px solid rgba(0, 188, 212, 0.5)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 188, 212, 0.4)",
    backdropFilter: "blur(15px)",
    zIndex: 1000,
    animation: "slideInRight 0.3s ease-out",
  },
  sidePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(0, 188, 212, 0.2)",
  },
  sidePanelTitle: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#00bcd4",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  sidePanelClose: {
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    transition: "all 0.3s ease",
    lineHeight: 1,
  },
  sidePanelEventInfo: {
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(0, 188, 212, 0.2)",
  },
  sidePanelEventName: {
    fontSize: "16px",
    fontWeight: "900",
    color: "#fff",
    marginBottom: "6px",
  },
  sidePanelEventDate: {
    fontSize: "12px",
    color: "#00bcd4",
    fontWeight: "600",
  },
  actionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  actionItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    background: "linear-gradient(135deg, rgba(40, 15, 15, 0.6), rgba(30, 10, 18, 0.4))",
    border: "2px solid rgba(204, 0, 0, 0.2)",
    borderRadius: "8px",
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  actionItemHover: {
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(0, 188, 212, 0.1))",
  },
  actionIcon: {
    fontSize: "20px",
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
    textAlign: "left",
  },
};

export default Watchtower;
