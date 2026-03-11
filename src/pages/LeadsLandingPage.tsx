/**
 * LeadsLandingPage — grid layout identical to EventPipelineLandingPage.
 * Filters: Overdue, Due today, Hot Lead, Proposal Sent.
 * Sort default: NextFollowUpDate ascending.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadLeads, getLeadUrgency, type LeadListItem } from "../services/airtable/leads";
import { LeadCard } from "../components/leads/LeadCard";
import { LeadOverviewModal } from "../components/leads/LeadOverviewModal";
import "./DashboardPage.css";
import "../components/EventsPipeline.css";

type LeadViewTab = "All Leads" | "Overdue" | "Due Today" | "Hot Lead" | "Proposal Sent";
type LeadSortBy = "name" | "inquiryDate" | "nextFollowUp" | "status";

export default function LeadsLandingPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<LeadViewTab>("All Leads");
  const [sortBy, setSortBy] = useState<LeadSortBy>("nextFollowUp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
    if (activeTab === "Overdue") arr = arr.filter((l) => getLeadUrgency(l.nextFollowUpDate) === "overdue");
    else if (activeTab === "Due Today") arr = arr.filter((l) => getLeadUrgency(l.nextFollowUpDate) === "due_today");
    else if (activeTab === "Hot Lead") arr = arr.filter((l) => (l.leadStatus ?? "").toLowerCase().includes("hot"));
    else if (activeTab === "Proposal Sent") arr = arr.filter((l) => l.proposalSent === true);
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
    setSelectedLeadId(lead.id);
  };

  const handleCloseModal = () => {
    setSelectedLeadId(null);
  };

  const handleLeadUpdated = () => {
    loadLeads().then((result) => {
      if (typeof result === "object" && !("error" in result) && Array.isArray(result)) {
        setLeads(result);
      }
    });
  };

  return (
    <div className="pipeline-view" style={{ padding: 24, width: "100%" }}>
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
              <option value="Hot Lead">Hot Lead</option>
              <option value="Proposal Sent">Proposal Sent</option>
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
          <button
            type="button"
            onClick={() => navigate("/foh/leads/new")}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              background: "linear-gradient(135deg, rgba(204,0,0,0.4), rgba(255,51,51,0.3))",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            + New Lead
          </button>
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
        )}
      </div>

      {selectedLeadId && (
        <LeadOverviewModal
          leadId={selectedLeadId}
          onClose={handleCloseModal}
          onUpdated={handleLeadUpdated}
        />
      )}
    </div>
  );
}
