import { useState, useEffect } from "react";
import { useEventStore } from "../../state/eventStore";
import { FIELD_IDS } from "../../services/airtable/events";

export const ExceptionsPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fieldValue = selectedEventData[FIELD_IDS.EXCEPTIONS_SPECIAL_HANDLING];
    setValue(typeof fieldValue === "string" ? fieldValue : "");
  }, [selectedEventData]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleBlur = async () => {
    if (!selectedEventId) return;
    
    const fieldValue = selectedEventData[FIELD_IDS.EXCEPTIONS_SPECIAL_HANDLING];
    const currentValue = typeof fieldValue === "string" ? fieldValue : "";
    
    // Only save if value changed
    if (value !== currentValue) {
      setIsSaving(true);
      await setFields(selectedEventId, {
        [FIELD_IDS.EXCEPTIONS_SPECIAL_HANDLING]: value,
      });
      setIsSaving(false);
    }
  };

  if (!selectedEventId) return null;

  return (
    <div
      className="rounded-lg mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(30, 10, 10, 0.8), rgba(25, 10, 15, 0.6))",
        border: "2px solid rgba(255, 193, 7, 0.4)",
        padding: "24px",
        backdropFilter: "blur(5px)",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 193, 7, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-1">
              Exceptions / Special Handling
            </h3>
            <p className="text-xs text-gray-500">
              Document any special requirements, allergies, or important notes
            </p>
          </div>
        </div>
        {isSaving && (
          <span className="text-xs text-yellow-400 font-semibold">Saving...</span>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-2 tracking-widest uppercase">
          Special Handling Notes
        </label>
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Enter any exceptions, special handling requirements, critical allergies, or important notes..."
          rows={6}
          className="w-full px-4 py-3 rounded-md text-gray-100 focus:outline-none focus:ring-2 transition resize-y"
          style={{
            backgroundColor: "#1a1a1a",
            border: "2px solid rgba(255, 193, 7, 0.3)",
            minHeight: "120px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 193, 7, 0.6)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 193, 7, 0.3)";
            e.currentTarget.style.boxShadow = "none";
            handleBlur();
          }}
        />
        
        <p className="text-xs text-gray-600 mt-2 italic">
          💡 This field supports rich text formatting and will be prominently displayed on the BEO
        </p>
      </div>
    </div>
  );
};
