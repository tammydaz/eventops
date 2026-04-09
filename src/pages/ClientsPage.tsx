import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadAllClients,
  createClient,
  updateClient,
  deleteClient,
  CLIENT_FIELD_IDS,
  type ClientRecord,
} from "../services/airtable/clients";
import { isErrorResult } from "../services/airtable/selectors";
import "./ClientsPage.css";

// ── Helpers ──

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "clientsBadge clientsBadgeActive";
  if (s === "inactive") return "clientsBadge clientsBadgeInactive";
  return "clientsBadge clientsBadgeOther";
}

function typeBadgeClass(type: string): string {
  const t = type.toLowerCase();
  if (t === "corporate") return "clientsBadge clientsBadgeCorporate";
  if (t === "individual") return "clientsBadge clientsBadgeIndividual";
  if (t.includes("venue")) return "clientsBadge clientsBadgeVenue";
  return "clientsBadge clientsBadgeOther";
}

// ── Form state ──
type ClientFormData = {
  clientName: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  address: string;
  clientSince: string;
  clientStatus: string;
  clientNotes: string;
  relationshipManager: string;
  clientType: string;
};

const EMPTY_FORM: ClientFormData = {
  clientName: "",
  companyName: "",
  phoneNumber: "",
  email: "",
  address: "",
  clientSince: "",
  clientStatus: "Active",
  clientNotes: "",
  relationshipManager: "",
  clientType: "",
};

function formFromRecord(rec: ClientRecord): ClientFormData {
  return {
    clientName: rec.clientName,
    companyName: rec.companyName,
    phoneNumber: rec.phoneNumber,
    email: rec.email,
    address: rec.address,
    clientSince: rec.clientSince ? rec.clientSince.split("T")[0] : "",
    clientStatus: rec.clientStatus || "Active",
    clientNotes: rec.clientNotes,
    relationshipManager: rec.relationshipManager,
    clientType: rec.clientType,
  };
}

function formToAirtableFields(form: ClientFormData): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  fields[CLIENT_FIELD_IDS.CLIENT_NAME] = form.clientName.trim();
  if (form.companyName.trim()) fields[CLIENT_FIELD_IDS.COMPANY_NAME] = form.companyName.trim();
  if (form.phoneNumber.trim()) fields[CLIENT_FIELD_IDS.PHONE_NUMBER] = form.phoneNumber.trim();
  if (form.email.trim()) fields[CLIENT_FIELD_IDS.EMAIL] = form.email.trim();
  if (form.address.trim()) fields[CLIENT_FIELD_IDS.ADDRESS] = form.address.trim();
  if (form.clientSince) fields[CLIENT_FIELD_IDS.CLIENT_SINCE] = form.clientSince;
  if (form.clientStatus) fields[CLIENT_FIELD_IDS.CLIENT_STATUS] = { name: form.clientStatus };
  if (form.clientNotes.trim()) fields[CLIENT_FIELD_IDS.CLIENT_NOTES] = form.clientNotes.trim();
  if (form.relationshipManager.trim()) fields[CLIENT_FIELD_IDS.RELATIONSHIP_MANAGER] = form.relationshipManager.trim();
  if (form.clientType) fields[CLIENT_FIELD_IDS.CLIENT_TYPE] = { name: form.clientType };
  return fields;
}

// ── Modal Component ──

function ClientFormModal({
  mode,
  initial,
  onSave,
  onDelete,
  onClose,
  saving,
  error,
}: {
  mode: "add" | "edit";
  initial: ClientFormData;
  onSave: (data: ClientFormData) => void;
  onDelete?: () => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<ClientFormData>(initial);

  const set = (field: keyof ClientFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="clientsModalOverlay" onClick={onClose}>
      <div className="clientsModal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === "add" ? "➕ Add New Client" : "✏️ Edit Client"}</h2>

        <div className="clientsFormGroup">
          <label className="clientsFormLabel">Client Name *</label>
          <input className="clientsFormInput" value={form.clientName} onChange={set("clientName")} placeholder="Full name" />
        </div>

        <div className="clientsFormRow">
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Company Name</label>
            <input className="clientsFormInput" value={form.companyName} onChange={set("companyName")} placeholder="Business or org" />
          </div>
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Client Type</label>
            <select className="clientsFormSelect" value={form.clientType} onChange={set("clientType")}>
              <option value="">— Select —</option>
              <option value="Corporate">Corporate</option>
              <option value="Individual">Individual</option>
              <option value="Venue Partner">Venue Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="clientsFormRow">
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Phone Number</label>
            <input className="clientsFormInput" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="(555) 123-4567" />
          </div>
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Email</label>
            <input className="clientsFormInput" type="email" value={form.email} onChange={set("email")} placeholder="client@example.com" />
          </div>
        </div>

        <div className="clientsFormGroup">
          <label className="clientsFormLabel">Address</label>
          <textarea className="clientsFormTextarea" value={form.address} onChange={set("address")} placeholder="Mailing or billing address" rows={2} />
        </div>

        <div className="clientsFormRow">
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Relationship Manager</label>
            <input className="clientsFormInput" value={form.relationshipManager} onChange={set("relationshipManager")} placeholder="Who manages this client" />
          </div>
          <div className="clientsFormGroup">
            <label className="clientsFormLabel">Client Status</label>
            <select className="clientsFormSelect" value={form.clientStatus} onChange={set("clientStatus")}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="clientsFormGroup">
          <label className="clientsFormLabel">Client Since</label>
          <input className="clientsFormInput" type="date" value={form.clientSince} onChange={set("clientSince")} />
        </div>

        <div className="clientsFormGroup">
          <label className="clientsFormLabel">Notes</label>
          <textarea className="clientsFormTextarea" value={form.clientNotes} onChange={set("clientNotes")} placeholder="General notes about this client…" rows={3} />
        </div>

        {error && <div className="clientsError">{error}</div>}

        <div className="clientsModalActions">
          {mode === "edit" && onDelete && (
            <button className="clientsDeleteBtn" onClick={onDelete} disabled={saving}>
              Delete
            </button>
          )}
          <button className="clientsCancelBtn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="clientsSaveBtn"
            onClick={() => onSave(form)}
            disabled={saving || !form.clientName.trim()}
          >
            {saving ? "Saving…" : mode === "add" ? "Create Client" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // ── Load ──
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await loadAllClients();
    if (isErrorResult(res)) {
      setLoadError(typeof res.message === "string" ? res.message : "Failed to load clients");
      setLoading(false);
      return;
    }
    setClients(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.clientStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (typeFilter !== "all" && c.clientType.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (q) {
        const haystack = [c.clientName, c.companyName, c.email, c.phoneNumber, c.relationshipManager]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [clients, search, statusFilter, typeFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.clientStatus.toLowerCase() === "active").length;
    const corporate = clients.filter((c) => c.clientType.toLowerCase() === "corporate").length;
    const totalEvents = clients.reduce((sum, c) => sum + c.totalEventCount, 0);
    return { total, active, corporate, totalEvents };
  }, [clients]);

  // ── Handlers ──
  const openAdd = () => {
    setEditingClient(null);
    setModalMode("add");
    setFormError(null);
  };

  const openEdit = (rec: ClientRecord) => {
    setEditingClient(rec);
    setModalMode("edit");
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingClient(null);
    setFormError(null);
  };

  const handleSave = async (form: ClientFormData) => {
    if (!form.clientName.trim()) {
      setFormError("Client Name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);

    const fields = formToAirtableFields(form);

    if (modalMode === "add") {
      const res = await createClient(fields);
      if (isErrorResult(res)) {
        setFormError(typeof res.message === "string" ? res.message : "Failed to create client");
        setSaving(false);
        return;
      }
      setClients((prev) => [res, ...prev]);
    } else if (modalMode === "edit" && editingClient) {
      const res = await updateClient(editingClient.id, fields);
      if (isErrorResult(res)) {
        setFormError(typeof res.message === "string" ? res.message : "Failed to update client");
        setSaving(false);
        return;
      }
      setClients((prev) => prev.map((c) => (c.id === res.id ? res : c)));
    }

    setSaving(false);
    closeModal();
  };

  const handleDelete = async () => {
    if (!editingClient) return;
    if (!window.confirm(`Delete client "${editingClient.clientName}"? This cannot be undone.`)) return;
    setSaving(true);
    setFormError(null);
    const res = await deleteClient(editingClient.id);
    if (isErrorResult(res)) {
      setFormError(typeof res.message === "string" ? res.message : "Failed to delete client");
      setSaving(false);
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== editingClient.id));
    setSaving(false);
    closeModal();
  };

  // ── Render ──
  return (
    <div className="clientsPage">
      <h1>👥 Clients</h1>
      <p className="clientsPageSubtitle">Manage client relationships, contact info, and event history.</p>

      {/* Stats */}
      <div className="clientsStats">
        <div className="clientsStatCard">
          <div className="clientsStatValue">{stats.total}</div>
          <div className="clientsStatLabel">Total Clients</div>
        </div>
        <div className="clientsStatCard">
          <div className="clientsStatValue">{stats.active}</div>
          <div className="clientsStatLabel">Active</div>
        </div>
        <div className="clientsStatCard">
          <div className="clientsStatValue">{stats.corporate}</div>
          <div className="clientsStatLabel">Corporate</div>
        </div>
        <div className="clientsStatCard">
          <div className="clientsStatValue">{stats.totalEvents}</div>
          <div className="clientsStatLabel">Total Events</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="clientsToolbar">
        <input
          className="clientsSearch"
          placeholder="Search by name, company, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="clientsFilterSelect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="clientsFilterSelect" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="corporate">Corporate</option>
          <option value="individual">Individual</option>
          <option value="venue partner">Venue Partner</option>
          <option value="other">Other</option>
        </select>
        <button className="clientsAddBtn" onClick={openAdd}>
          + Add Client
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="clientsLoading">Loading clients…</div>
      ) : loadError ? (
        <div className="clientsEmpty">
          <div style={{ marginBottom: 8 }}>⚠️ {loadError}</div>
          <button className="clientsSaveBtn" onClick={fetchClients}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="clientsTableWrap">
          <div className="clientsEmpty">
            {clients.length === 0 ? (
              <>
                No clients yet.{" "}
                <button className="clientsAddBtn" style={{ display: "inline", fontSize: 12 }} onClick={openAdd}>
                  + Add your first client
                </button>
              </>
            ) : (
              "No clients match your filters."
            )}
          </div>
        </div>
      ) : (
        <div className="clientsTableWrap">
          <table className="clientsTable">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Company</th>
                <th>Type</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Manager</th>
                <th>Events</th>
                <th>Last Event</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => openEdit(c)}>
                  <td>
                    <Link
                      to={`/client/${c.id}`}
                      className="clientsDetailLink"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.clientName || "—"}
                    </Link>
                  </td>
                  <td>{c.companyName || "—"}</td>
                  <td>
                    {c.clientType ? (
                      <span className={typeBadgeClass(c.clientType)}>{c.clientType}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {c.clientStatus ? (
                      <span className={statusBadgeClass(c.clientStatus)}>{c.clientStatus}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{c.phoneNumber || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.relationshipManager || "—"}</td>
                  <td style={{ textAlign: "center" }}>{c.totalEventCount}</td>
                  <td>{formatDate(c.lastEventDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalMode && (
        <ClientFormModal
          mode={modalMode}
          initial={editingClient ? formFromRecord(editingClient) : EMPTY_FORM}
          onSave={handleSave}
          onDelete={modalMode === "edit" ? handleDelete : undefined}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
