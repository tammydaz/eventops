/**
 * FOH Leads landing page — same grid layout as EventPipelineLandingPage.
 * Uses Search, Sort, View controls. Lead cards show urgency colors.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadLeads, getLeadUrgency, type LeadListItem } from "../services/airtable/leads";
import "./DashboardPage.css";
import "../components/EventsPipeline.css";

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    const date = new Date(y, m - 1, day);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${day}`;
  } catch {
    return d;
  }
}

type LeadViewTab = "All Leads" | "Overdue" | "Due Today" | "Upcoming" | "No Follow-Up";
type LeadSortBy = "name" | "inquiryDate" | "nextFollowUp" | "status";

export default function FOHLeadLandingPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<LeadViewTab>("All Leads");
  const [sortBy, setSortBy] = useState<LeadSortBy>("nextFollowUp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [leadView, setLeadView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLeads().then((result) => {
      if (cancelled) return;
      if (typeof result === "object" && "error" in result) {
        setError(result.message ?? "Failed to load leads");
        setLeads([]);
      } else {
        setLeads(Array.isArray(result) ? result : []);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filteredLeads = useMemo(() => {
    let arr = leads;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (l) =>
          l.leadName.toLowerCase().includes(q) ||
          (l.contactInfo ?? "").toLowerCase().includes(q) ||
          (l.leadStatus ?? "").toLowerCase().includes(q)
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (activeTab === "Overdue") arr = arr.filter((l) => getLeadUrgency(l.nextFollowUpDate) === "overdue");
    else if (activeTab === "Due Today") arr = arr.filter((l) => getLeadUrgency(l.nextFollowUpDate) === "due_today");
    else if (activeTab === "Upcoming") arr = arr.filter((l) => getLeadUrgency(l.nextFollowUpDate) === "scheduled");
    else if (activeTab === "No Follow-Up") arr = arr.filter((l) => !l.nextFollowUpDate);
    return arr;
  }, [leads, activeTab, search]);

  const sortedLeads = useMemo(() => {
    const arr = [...filteredLeads];
    const mult = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = (a.leadName ?? "").localeCompare(b.leadName ?? "");
      else if (sortBy === "inquiryDate") cmp = (a.inquiryDate ?? "").localeCompare(b.inquiryDate ?? "");
      else if (sortBy === "nextFollowUp") {
        const ad = a.nextFollowUpDate ?? "9999-99-99";
        const bd = b.nextFollowUpDate ?? "9999-99-99";
        cmp = ad.localeCompare(bd);
      } else if (sortBy === "status") cmp = (a.leadStatus ?? "").localeCompare(b.leadStatus ?? "");
      return mult * cmp;
    });
    return arr;
  }, [filteredLeads, sortBy, sortDir]);

  const handleSelectLead = (lead: LeadListItem) => {
    navigate(`/lead/${lead.id}`);
  };

  return (
    <div className="pipeline-view" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>Leads Pipeline</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          {sortedLeads.length} leads
        </p>
      </div>

      <div className="dp-tabs-toolbar">
        <div className="dp-tabs-left">
          <div className="dp-toolbar-sort">
            <label htmlFor="lead-view-select" className="dp-toolbar-label">View</label>
            <select
              id="lead-view-select"
              className="dp-toolbar-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as LeadViewTab)}
            >
              <option value="All Leads">All Leads</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Today">Due Today</option>
              <option value="Upcoming">Upcoming</option>
              <option value="No Follow-Up">No Follow-Up</option>
            </select>
          </div>
          <div className="dp-toolbar-sort">
            <label htmlFor="lead-sort-select" className="dp-toolbar-label">Sort by</label>
            <select
              id="lead-sort-select"
              className="dp-toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LeadSortBy)}
            >
              <option value="nextFollowUp">Next Follow-Up</option>
              <option value="inquiryDate">Inquiry Date</option>
              <option value="name">Lead Name</option>
              <option value="status">Status</option>
            </select>
            <button
              type="button"
              className="dp-toolbar-sort-dir"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="dp-toolbar-sort">
            <label htmlFor="lead-search" className="dp-toolbar-label">Search</label>
            <input
              id="lead-search"
              type="search"
              className="dp-toolbar-select"
              placeholder="Name, contact, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 160 }}
            />
          </div>
        </div>
        <div className="dp-tabs-right">
          <div className="dp-toolbar-view">
            <span className="dp-toolbar-view-label">View</span>
            <button
              type="button"
              className={`dp-toolbar-view-btn ${leadView === "grid" ? "active" : ""}`}
              onClick={() => setLeadView("grid")}
              aria-pressed={leadView === "grid"}
            >
              ⊞ Grid
            </button>
            <button
              type="button"
              className={`dp-toolbar-view-btn ${leadView === "list" ? "active" : ""}`}
              onClick={() => setLeadView("list")}
              aria-pressed={leadView === "list"}
            >
              ☰ List
            </button>
          </div>
          <div className="dp-tab-stats">
            <span className="dp-stat-count">{sortedLeads.length} leads</span>
          </div>
        </div>
      </div>

      <div className="dp-events-area">
        {error && (
          <div className="dp-events-error" style={{ marginBottom: 16 }}>
            <span>{error}</span>
          </div>
        )}
        {loading && <div className="dp-events-loading">Loading leads…</div>}
        {!loading && !error && (
          leadView === "grid" ? (
            <div className="dp-events-grid">
              {sortedLeads.length === 0 ? (
                <div className="dp-events-empty">
                  <p>No leads in &quot;{activeTab}&quot;</p>
                  <p className="dp-events-empty-hint">
                    Add leads in Airtable or configure VITE_AIRTABLE_LEADS_TABLE.
                  </p>
                </div>
              ) : (
                sortedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onSelect={() => handleSelectLead(lead)} />
                ))
              )}
            </div>
          ) : (
            <div className="dp-events-list">
              {sortedLeads.length === 0 ? (
                <div className="dp-events-empty">
                  <p>No leads in &quot;{activeTab}&quot;</p>
                </div>
              ) : (
                <>
                  <div className="dp-list-header">
                    <div className="dp-list-col" style={{ flex: "1 1 140px" }}>Lead Name</div>
                    <div className="dp-list-col" style={{ flex: "0 0 100px" }}>Inquiry</div>
                    <div className="dp-list-col" style={{ flex: "0 0 100px" }}>Follow-Up</div>
                    <div className="dp-list-col" style={{ flex: "0 0 90px" }}>Status</div>
                    <div className="dp-list-col" style={{ flex: "0 0 60px" }}>Urgency</div>
                  </div>
                  {sortedLeads.map((lead) => {
                    const urgency = getLeadUrgency(lead.nextFollowUpDate);
                    return (
                      <div
                        key={lead.id}
                        className="dp-list-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectLead(lead)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectLead(lead)}
                      >
                        <div className="dp-list-col" style={{ flex: "1 1 140px" }}>{lead.leadName}</div>
                        <div className="dp-list-col" style={{ flex: "0 0 100px" }}>{formatDate(lead.inquiryDate)}</div>
                        <div className="dp-list-col" style={{ flex: "0 0 100px" }}>{formatDate(lead.nextFollowUpDate)}</div>
                        <div className="dp-list-col" style={{ flex: "0 0 90px" }}>{lead.leadStatus}</div>
                        <div className="dp-list-col" style={{ flex: "0 0 60px" }}>
                          {urgency && (
                            <span
                              className="dp-list-pill"
                              style={{
                                color: urgency === "overdue" ? "#ef4444" : urgency === "due_today" ? "#eab308" : "#22c55e",
                                backgroundColor: urgency === "overdue" ? "rgba(239,68,68,0.2)" : urgency === "due_today" ? "rgba(234,179,8,0.2)" : "rgba(34,197,94,0.2)",
                              }}
                            >
                              {urgency === "overdue" ? "Overdue" : urgency === "due_today" ? "Today" : "Scheduled"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onSelect }: { lead: LeadListItem; onSelect: () => void }) {
  const urgency = getLeadUrgency(lead.nextFollowUpDate);
  const urgencyColor = urgency === "overdue" ? "#ef4444" : urgency === "due_today" ? "#eab308" : "#22c55e";
  const urgencyBg = urgency === "overdue" ? "rgba(239,68,68,0.15)" : urgency === "due_today" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.12)";
  const hasNotes = Boolean(lead.fohNotes?.trim());

  return (
    <article
      className="dp-card dp-card-clickable"
      style={{
        background: "linear-gradient(135deg, rgba(45,45,45,0.9), rgba(35,35,35,0.7))",
        border: `1px solid ${urgency ? `${urgencyColor}50` : "#6b7280"}`,
        borderRadius: 10,
        position: "relative",
      }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      {hasNotes && (
        <div
          title={lead.fohNotes}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(168,85,247,0.4)",
            border: "1px solid rgba(168,85,247,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
          }}
        >
          📝
        </div>
      )}
      <div className="dp-card-header dp-card-header-tight">
        <div className="dp-card-client" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          {formatDate(lead.inquiryDate)}
        </div>
        <div className="dp-card-name">{lead.leadName}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
        <span
          className="dp-list-pill"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          {lead.leadStatus}
        </span>
        {urgency && (
          <span
            className="dp-list-pill"
            style={{
              fontSize: 11,
              color: urgencyColor,
              backgroundColor: urgencyBg,
              borderColor: `${urgencyColor}60`,
            }}
          >
            {urgency === "overdue" ? "Overdue" : urgency === "due_today" ? "Due Today" : "Scheduled"}
          </span>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        Next: {formatDate(lead.nextFollowUpDate)}
      </div>
    </article>
  );
}
