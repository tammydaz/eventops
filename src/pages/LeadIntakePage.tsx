/**
 * LeadIntakePage — form for creating a new lead.
 * Sections: Lead Identity, Client Contact, Event Basics, Follow-Up Engine, Proposal Tracking, Lead Notes.
 * On submit: create in Leads table, redirect to LeadsLandingPage.
 */
import { useState, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createLead } from "../services/airtable/leads";
import { isErrorResult } from "../services/airtable/selectors";
import "./DashboardPage.css";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  color: "#e0e0e0",
  fontSize: 14,
  boxSizing: "border-box" as const,
};

const labelStyle = { display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6 };

const sectionStyle = {
  padding: 20,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.2)",
  marginBottom: 20,
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function DatePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const initialForm = {
  LeadName: "",
  InquiryDate: "",
  Source: "",
  ClientFirstName: "",
  ClientLastName: "",
  Phone: "",
  Email: "",
  PreferredContactMethod: "",
  BestTimeToReach: "",
  EstimatedEventDate: "",
  EventType: "",
  EstimatedGuestCount: "",
  Venue: "",
  BudgetRange: "",
  LeadStatus: "",
  NextFollowUpDate: "",
  FollowUpPriority: "",
  LastContactDate: "",
  TimesContacted: "",
  FollowUpNotes: "",
  ProposalNeeded: false,
  ProposalSent: false,
  ProposalDate: "",
  EstimatedPriceRange: "",
  MenuIdeas: "",
  SpecialRequests: "",
  LeadNotes: "",
};

export default function LeadIntakePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof initialForm, value: string | number | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const saveLead = async () => {
    setError(null);
    if (!form.LeadName.trim()) {
      setError("Lead Name is required");
      return;
    }
    setSubmitting(true);
    const contactLines = [
      form.ClientFirstName.trim() && `Client: ${form.ClientFirstName} ${form.ClientLastName}`.trim(),
      form.Phone.trim() && `Phone: ${form.Phone}`,
      form.Email.trim() && `Email: ${form.Email}`,
      form.PreferredContactMethod.trim() && `Preferred: ${form.PreferredContactMethod}`,
      form.BestTimeToReach.trim() && `Best time: ${form.BestTimeToReach}`,
    ].filter(Boolean);
    const contactInfo = contactLines.join("\n") || undefined;

    const result = await createLead({
      leadName: form.LeadName.trim(),
      inquiryDate: form.InquiryDate || undefined,
      source: form.Source.trim() || undefined,
      clientFirstName: form.ClientFirstName.trim() || undefined,
      clientLastName: form.ClientLastName.trim() || undefined,
      phone: form.Phone.trim() || undefined,
      email: form.Email.trim() || undefined,
      preferredContactMethod: form.PreferredContactMethod.trim() || undefined,
      bestTimeToReach: form.BestTimeToReach.trim() || undefined,
      contactInfo,
      estimatedEventDate: form.EstimatedEventDate || undefined,
      eventType: form.EventType.trim() || undefined,
      estimatedGuestCount: form.EstimatedGuestCount ? parseInt(form.EstimatedGuestCount, 10) : undefined,
      venue: form.Venue.trim() || undefined,
      budgetRange: form.BudgetRange.trim() || undefined,
      leadStatus: form.LeadStatus || "New",
      nextFollowUpDate: form.NextFollowUpDate || undefined,
      followUpPriority: ["Urgent", "High", "Medium", "Low"].includes(form.FollowUpPriority)
        ? (form.FollowUpPriority as "Urgent" | "High" | "Medium" | "Low")
        : undefined,
      lastContact: form.LastContactDate || undefined,
      timesContacted: form.TimesContacted ? parseInt(form.TimesContacted, 10) : undefined,
      followUpNotes: form.FollowUpNotes.trim() || undefined,
      proposalNeeded: form.ProposalNeeded,
      proposalSent: form.ProposalSent,
      proposalDate: form.ProposalDate || undefined,
      estimatedPriceRange: form.EstimatedPriceRange.trim() || undefined,
      menuIdeas: form.MenuIdeas.trim() || undefined,
      specialRequests: form.SpecialRequests.trim() || undefined,
      notes: form.LeadNotes.trim() || undefined,
      followUpHistory: form.LeadNotes.trim() || undefined,
    });
    setSubmitting(false);
    if (isErrorResult(result)) {
      setError(result.message ?? "Failed to create lead");
      return;
    }
    navigate("/foh/leads");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0f0a15 100%)",
        color: "#e0e0e0",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          to="/foh/leads"
          style={{ display: "inline-block", color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20, textDecoration: "none" }}
        >
          ← Back to Leads
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 24px 0" }}>
          New Lead Intake
        </h1>

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.5)",
              borderRadius: 8,
              color: "#ef4444",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SectionCard title="Lead Identity">
            <Input label="Lead Name" value={form.LeadName} onChange={(e) => update("LeadName", e.target.value)} />
            <DatePicker label="Inquiry Date" value={form.InquiryDate} onChange={(v) => update("InquiryDate", v)} />
            <Input label="Source" value={form.Source} onChange={(e) => update("Source", e.target.value)} />
          </SectionCard>

          <SectionCard title="Client Contact">
            <Input label="Client First Name" value={form.ClientFirstName} onChange={(e) => update("ClientFirstName", e.target.value)} />
            <Input label="Client Last Name" value={form.ClientLastName} onChange={(e) => update("ClientLastName", e.target.value)} />
            <Input label="Phone" value={form.Phone} onChange={(e) => update("Phone", e.target.value)} type="tel" />
            <Input label="Email" value={form.Email} onChange={(e) => update("Email", e.target.value)} type="email" />
            <Input label="Preferred Contact Method" value={form.PreferredContactMethod} onChange={(e) => update("PreferredContactMethod", e.target.value)} />
            <Input label="Best Time to Reach" value={form.BestTimeToReach} onChange={(e) => update("BestTimeToReach", e.target.value)} />
          </SectionCard>

          <SectionCard title="Event Basics">
            <DatePicker label="Estimated Event Date" value={form.EstimatedEventDate} onChange={(v) => update("EstimatedEventDate", v)} />
            <Input label="Event Type" value={form.EventType} onChange={(e) => update("EventType", e.target.value)} placeholder="Full Service, Delivery, etc." />
            <Input label="Estimated Guest Count" value={form.EstimatedGuestCount} onChange={(e) => update("EstimatedGuestCount", e.target.value)} type="number" />
            <Input label="Venue (If Known)" value={form.Venue} onChange={(e) => update("Venue", e.target.value)} />
            <Input label="Budget Range" value={form.BudgetRange} onChange={(e) => update("BudgetRange", e.target.value)} />
          </SectionCard>

          <SectionCard title="Follow-Up Engine">
            <Select
              label="Lead Status"
              value={form.LeadStatus}
              options={["New", "Warm Lead", "Hot Lead", "Cold Lead", "Closed"]}
              onChange={(v) => update("LeadStatus", v)}
            />
            <DatePicker label="Next Follow-Up Date" value={form.NextFollowUpDate} onChange={(v) => update("NextFollowUpDate", v)} />
            <Select
              label="Follow-Up Priority"
              value={form.FollowUpPriority}
              options={["Low", "Medium", "High", "Urgent"]}
              onChange={(v) => update("FollowUpPriority", v)}
            />
            <DatePicker label="Last Contact Date" value={form.LastContactDate} onChange={(v) => update("LastContactDate", v)} />
            <Input label="Times Contacted" value={form.TimesContacted} onChange={(e) => update("TimesContacted", e.target.value)} type="number" />
            <TextArea label="Follow-Up Notes" value={form.FollowUpNotes} onChange={(e) => update("FollowUpNotes", e.target.value)} rows={2} />
          </SectionCard>

          <SectionCard title="Proposal Tracking">
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.ProposalNeeded}
                  onChange={(e) => update("ProposalNeeded", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#cc0000" }}
                />
                Proposal Needed?
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.ProposalSent}
                  onChange={(e) => update("ProposalSent", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#cc0000" }}
                />
                Proposal Sent?
              </label>
            </div>
            <DatePicker label="Proposal Date" value={form.ProposalDate} onChange={(v) => update("ProposalDate", v)} />
            <Input label="Estimated Price Range" value={form.EstimatedPriceRange} onChange={(e) => update("EstimatedPriceRange", e.target.value)} />
            <TextArea label="Menu Ideas / Requested Concepts" value={form.MenuIdeas} onChange={(e) => update("MenuIdeas", e.target.value)} rows={2} />
            <TextArea label="Special Requests" value={form.SpecialRequests} onChange={(e) => update("SpecialRequests", e.target.value)} rows={2} />
          </SectionCard>

          <SectionCard title="Lead Notes">
            <TextArea label="Lead Notes" value={form.LeadNotes} onChange={(e) => update("LeadNotes", e.target.value)} rows={3} />
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button
              type="button"
              onClick={saveLead}
              disabled={submitting}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #cc0000, #ff3333)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Saving…" : "Save Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
