import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type StatusDetails } from "../../services/airtable/events";
import { asBoolean, asSingleSelectName } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Completed",
  "Ordered",
  "Inquiry",
  "Kitchen Ready",
  "Yes",
  "Print – Timeline (Full Service Only)",
  "5:30 PM – Staff arrival ...",
  "Client Address",
  "5 Oak Ln NJ",
  "Status (legacy)",
];

const BOOKING_STATUS_OPTIONS = [
  "Pending",
  "Tentative",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Client Notified",
  "false",
  "Booking Status (legacy)",
  "Hold",
];

const PAYMENT_STATUS_OPTIONS = [
  "Unpaid",
  "Deposit Paid",
  "Partially Paid",
  "Paid in Full",
  "Refunded",
  "Payment Status (legacy)",
  "Paid",
  "Deposit",
];

const PAYMENT_TYPE_OPTIONS = [
  "Card",
  "ACH",
  "Cash",
  "Check",
  "Split",
  "Other",
  "Payment Type (legacy)",
  "Credit Card",
  "Zelle",
];

const emptyDetails: StatusDetails = {
  status: "",
  bookingStatus: "",
  paymentStatus: "",
  paymentType: "",
  contractSent: false,
  contractSigned: false,
  invoiceSent: false,
  invoicePaid: false,
};

export const StatusPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [details, setDetails] = useState<StatusDetails>(emptyDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setDetails(emptyDetails);
      return;
    }
    setIsLoading(false);
    setError(null);
    setDetails({
      status: asSingleSelectName(selectedEventData[FIELD_IDS.STATUS]),
      bookingStatus: asSingleSelectName(selectedEventData[FIELD_IDS.BOOKING_STATUS]),
      paymentStatus: asSingleSelectName(selectedEventData[FIELD_IDS.PAYMENT_STATUS]),
      paymentType: asSingleSelectName(selectedEventData[FIELD_IDS.PAYMENT_TYPE]),
      contractSent: asBoolean(selectedEventData[FIELD_IDS.CONTRACT_SENT]),
      contractSigned: asBoolean(selectedEventData[FIELD_IDS.CONTRACT_SIGNED]),
      invoiceSent: asBoolean(selectedEventData[FIELD_IDS.INVOICE_SENT]),
      invoicePaid: asBoolean(selectedEventData[FIELD_IDS.INVOICE_PAID]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const saveField = async (fieldId: string, value: unknown) => {
    if (!selectedEventId) return;
    await setFields(selectedEventId, { [fieldId]: value });
  };

  const handleChange = <K extends keyof StatusDetails>(key: K, value: StatusDetails[K]) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Status & Internal Tracking</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Status</label>
          <select
            value={details.status}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("status", event.target.value);
              saveField(FIELD_IDS.STATUS, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Booking Status</label>
          <select
            value={details.bookingStatus}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("bookingStatus", event.target.value);
              saveField(FIELD_IDS.BOOKING_STATUS, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select booking status</option>
            {BOOKING_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Payment Status</label>
          <select
            value={details.paymentStatus}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("paymentStatus", event.target.value);
              saveField(FIELD_IDS.PAYMENT_STATUS, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select payment status</option>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400">Payment Type</label>
          <select
            value={details.paymentType}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("paymentType", event.target.value);
              saveField(FIELD_IDS.PAYMENT_TYPE, event.target.value || null);
            }}
            className="mt-2 w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
          >
            <option value="">Select payment type</option>
            {PAYMENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="contract-sent"
            type="checkbox"
            checked={details.contractSent}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("contractSent", event.target.checked);
              saveField(FIELD_IDS.CONTRACT_SENT, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="contract-sent" className="text-xs uppercase tracking-widest text-gray-400">
            Contract Sent
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="contract-signed"
            type="checkbox"
            checked={details.contractSigned}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("contractSigned", event.target.checked);
              saveField(FIELD_IDS.CONTRACT_SIGNED, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="contract-signed" className="text-xs uppercase tracking-widest text-gray-400">
            Contract Signed
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="invoice-sent"
            type="checkbox"
            checked={details.invoiceSent}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("invoiceSent", event.target.checked);
              saveField(FIELD_IDS.INVOICE_SENT, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="invoice-sent" className="text-xs uppercase tracking-widest text-gray-400">
            Invoice Sent
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="invoice-paid"
            type="checkbox"
            checked={details.invoicePaid}
            disabled={!canEdit}
            onChange={(event) => {
              handleChange("invoicePaid", event.target.checked);
              saveField(FIELD_IDS.INVOICE_PAID, event.target.checked);
            }}
            className="h-4 w-4"
          />
          <label htmlFor="invoice-paid" className="text-xs uppercase tracking-widest text-gray-400">
            Invoice Paid
          </label>
        </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
