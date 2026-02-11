import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import WatchtowerSidebar from "../components/WatchtowerSidebar";

type EventListItem = {
  id: string;
  eventName: string;
  eventDate?: string;
  eventType?: string;
  serviceStyle?: string;
  guestCount?: number | string;
};

const Watchtower = () => {
  const { selectedEventId, setSelectedEventId, eventData, events, eventsLoading } = useEventStore() as {
    selectedEventId: string | null;
    setSelectedEventId: React.Dispatch<React.SetStateAction<string | null>>;
    eventData: Record<string, any>;
    events: EventListItem[];
    eventsLoading: boolean;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedEvent: EventListItem | null = selectedEventId
    ? (events as EventListItem[]).find((e) => e.id === selectedEventId) || null
    : null;

  const filteredEvents = events.filter((evt) =>
    evt.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEvent = (evt: EventListItem) => {
    setSelectedEventId(evt.id);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  return (
    <div style={styles.container}>
      {/* Animated background overlay */}
      <div style={styles.backgroundOverlay} />

      {/* Back to Dashboard Button */}
      <Link to="/" style={styles.backButton}>
        ← Back to Dashboard
      </Link>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div style={styles.diamondLogo}>
            <div style={styles.diamondInner}>PC</div>
          </div>
          <h1 style={styles.title}>Papa Chulo Watchtower</h1>
          <p style={styles.subtitle}>Command Center • Event Operations • Real-Time Intelligence</p>
        </div>

        {/* Event Selector Card */}
        <div style={styles.selectorCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>🎯</div>
            <div>
              <h3 style={styles.cardTitle}>Select Event</h3>
              <p style={styles.cardSubtitle}>Choose an event to access command operations</p>
            </div>
          </div>

          <div style={styles.dropdownContainer}>
            <button
              style={{
                ...styles.dropdownButton,
                ...(isDropdownOpen ? styles.dropdownButtonActive : {}),
              }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span style={styles.dropdownText}>
                {selectedEvent ? selectedEvent.eventName : "-- Select an event --"}
              </span>
              <span style={styles.dropdownArrow}>{isDropdownOpen ? "▲" : "▼"}</span>
            </button>

            {isDropdownOpen && (
              <div style={styles.dropdownMenu}>
                <div style={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="🔍 Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                    autoFocus
                  />
                </div>

                <div style={styles.eventsList}>
                  {eventsLoading ? (
                    <div style={styles.loadingText}>Loading events...</div>
                  ) : filteredEvents.length === 0 ? (
                    <div style={styles.emptyText}>No events found</div>
                  ) : (
                    filteredEvents.map((evt) => (
                      <button
                        key={evt.id}
                        style={styles.eventItem}
                        onClick={() => handleSelectEvent(evt)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = styles.eventItemHover.background;
                          e.currentTarget.style.borderColor = styles.eventItemHover.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = styles.eventItem.background;
                          e.currentTarget.style.borderColor = styles.eventItem.borderColor;
                        }}
                      >
                        <div style={styles.eventItemName}>{evt.eventName}</div>
                        <div style={styles.eventItemDetails}>
                          {evt.eventDate && <span>📅 {evt.eventDate}</span>}
                          {evt.eventType && <span> • {evt.eventType}</span>}
                          {evt.guestCount && <span> • 👥 {evt.guestCount}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedEvent && (
            <div style={styles.selectedEventBadge}>
              <span style={styles.badgeIcon}>✓</span>
              <span style={styles.badgeText}>Event Selected: {selectedEvent.eventName}</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {selectedEvent && (
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statLabel}>Event Type</div>
              <div style={styles.statValue}>{selectedEvent.eventType || "N/A"}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statLabel}>Guest Count</div>
              <div style={styles.statValue}>{selectedEvent.guestCount || "N/A"}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🍽️</div>
              <div style={styles.statLabel}>Service Style</div>
              <div style={styles.statValue}>{selectedEvent.serviceStyle || "N/A"}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📅</div>
              <div style={styles.statLabel}>Event Date</div>
              <div style={styles.statValue}>{selectedEvent.eventDate || "N/A"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {selectedEventId && selectedEvent && (
        <WatchtowerSidebar
          event={Object.assign({}, selectedEvent, eventData)}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
    color: "#e0e0e0",
    position: "relative",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  backgroundOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "radial-gradient(circle at 20% 50%, rgba(0, 188, 212, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 188, 212, 0.05) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(0, 188, 212, 0.1))",
    border: "2px solid rgba(0, 188, 212, 0.4)",
    borderRadius: "8px",
    color: "#00bcd4",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    zIndex: 10,
    boxShadow: "0 4px 15px rgba(0, 188, 212, 0.2)",
  },
  mainContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "40px 20px",
  },
  headerSection: {
    textAlign: "center",
    marginBottom: "50px",
    animation: "fadeInDown 0.8s ease-out",
  },
  diamondLogo: {
    width: "120px",
    height: "120px",
    margin: "0 auto 30px",
    background: "linear-gradient(135deg, #00bcd4, #4dd0e1)",
    transform: "rotate(45deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 50px rgba(0, 188, 212, 0.8), 0 8px 20px rgba(0, 0, 0, 0.5)",
    animation: "pulse 2.5s ease-in-out infinite",
  },
  diamondInner: {
    transform: "rotate(-45deg)",
    fontSize: "32px",
    fontWeight: "900",
    color: "#fff",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
  },
  title: {
    fontSize: "48px",
    fontWeight: "900",
    background: "linear-gradient(135deg, #00bcd4, #4dd0e1, #80deea)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "15px",
    textShadow: "0 0 40px rgba(0, 188, 212, 0.5)",
    letterSpacing: "1px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#a0a0a0",
    fontWeight: "500",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  selectorCard: {
    width: "100%",
    maxWidth: "700px",
    background: "linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))",
    border: "2px solid #00bcd4",
    borderRadius: "16px",
    padding: "30px",
    backdropFilter: "blur(10px)",
    boxShadow:
      "0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 188, 212, 0.25), inset -2px -2px 8px rgba(0, 0, 0, 0.2), inset 2px 2px 8px rgba(255, 255, 255, 0.05)",
    animation: "fadeInUp 0.8s ease-out 0.2s backwards",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },
  cardIcon: {
    fontSize: "36px",
    filter: "drop-shadow(0 0 10px rgba(0, 188, 212, 0.6))",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "5px",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#a0a0a0",
  },
  dropdownContainer: {
    position: "relative",
    marginBottom: "20px",
  },
  dropdownButton: {
    width: "100%",
    padding: "16px 20px",
    background: "linear-gradient(135deg, rgba(40, 20, 20, 0.8), rgba(30, 15, 20, 0.6))",
    border: "2px solid rgba(0, 188, 212, 0.4)",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
    backdropFilter: "blur(5px)",
  },
  dropdownButtonActive: {
    borderColor: "#00bcd4",
    boxShadow: "0 0 20px rgba(0, 188, 212, 0.4)",
  },
  dropdownText: {
    flex: 1,
    textAlign: "left",
  },
  dropdownArrow: {
    color: "#00bcd4",
    fontSize: "12px",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: 0,
    right: 0,
    background: "linear-gradient(135deg, rgba(30, 10, 10, 0.95), rgba(25, 10, 15, 0.9))",
    border: "2px solid #00bcd4",
    borderRadius: "10px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 188, 212, 0.3)",
    backdropFilter: "blur(10px)",
    zIndex: 100,
    overflow: "hidden",
    animation: "slideDown 0.3s ease-out",
  },
  searchContainer: {
    padding: "15px",
    borderBottom: "1px solid rgba(0, 188, 212, 0.2)",
  },
  searchInput: {
    width: "100%",
    padding: "12px 15px",
    background: "rgba(0, 0, 0, 0.4)",
    border: "2px solid rgba(0, 188, 212, 0.3)",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.3s ease",
  },
  eventsList: {
    maxHeight: "400px",
    overflowY: "auto",
    padding: "10px",
  },
  eventItem: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, rgba(40, 20, 20, 0.6), rgba(30, 15, 20, 0.4))",
    border: "2px solid rgba(0, 188, 212, 0.2)",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "left",
    color: "#ffffff",
  },
  eventItemHover: {
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.3), rgba(0, 188, 212, 0.2))",
    borderColor: "#00bcd4",
  },
  eventItemName: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#ffffff",
  },
  eventItemDetails: {
    fontSize: "12px",
    color: "#a0a0a0",
  },
  loadingText: {
    padding: "20px",
    textAlign: "center",
    color: "#a0a0a0",
  },
  emptyText: {
    padding: "20px",
    textAlign: "center",
    color: "#888",
  },
  selectedEventBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(0, 188, 212, 0.1))",
    border: "2px solid rgba(0, 188, 212, 0.4)",
    borderRadius: "8px",
    marginTop: "15px",
  },
  badgeIcon: {
    fontSize: "18px",
    color: "#00bcd4",
  },
  badgeText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    width: "100%",
    maxWidth: "700px",
    marginTop: "30px",
    animation: "fadeInUp 0.8s ease-out 0.4s backwards",
  },
  statCard: {
    background: "linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))",
    border: "2px solid rgba(0, 188, 212, 0.3)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    backdropFilter: "blur(5px)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 188, 212, 0.15)",
    transition: "all 0.3s ease",
  },
  statIcon: {
    fontSize: "32px",
    marginBottom: "10px",
    filter: "drop-shadow(0 0 8px rgba(0, 188, 212, 0.4))",
  },
  statLabel: {
    fontSize: "11px",
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#00bcd4",
  },
};

export default Watchtower;
