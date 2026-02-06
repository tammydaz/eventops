import { useEffect, useMemo, useState } from "react";
import { FIELD_IDS, type StaffingSelections } from "../../services/airtable/events";
import { loadStaff, type LinkedRecordItem } from "../../services/airtable/linkedRecords";
import { asLinkedRecordIds, asString, isErrorResult } from "../../services/airtable/selectors";
import { useEventStore } from "../../state/eventStore";

const emptySelections: StaffingSelections = {
  staff: [],
  captain: "",
  servers: [],
  utility: [],
  stationCrew: [],
  chef: [],
  bartenders: [],
  displayDesign: [],
  diningCrew: [],
};

type SectionConfig = {
  key: keyof StaffingSelections;
  label: string;
  multi: boolean;
};

const SECTIONS: SectionConfig[] = [
  { key: "staff", label: "Staff", multi: true },
  { key: "captain", label: "Captain", multi: false },
  { key: "servers", label: "Servers", multi: true },
  { key: "utility", label: "Utility", multi: true },
  { key: "stationCrew", label: "Station Crew", multi: true },
  { key: "chef", label: "Chef", multi: true },
  { key: "bartenders", label: "Bartenders", multi: true },
  { key: "displayDesign", label: "Display Design", multi: true },
  { key: "diningCrew", label: "Dining Crew", multi: true },
];

export const StaffingPanel = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [staff, setStaff] = useState<LinkedRecordItem[]>([]);
  const [selections, setSelections] = useState<StaffingSelections>(emptySelections);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    const loadStaffList = async () => {
      try {
        const data = await loadStaff();
        if (active) {
          if (isErrorResult(data)) {
            setError(data.message ?? "Unknown error");
          } else {
            setStaff(data);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };

    loadStaffList();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId || !selectedEventData) {
      setSelections(emptySelections);
      return;
    }
    setIsLoading(false);
    setError(null);
    setSelections({
      staff: asLinkedRecordIds(selectedEventData[FIELD_IDS.STAFF]),
      captain: asString(selectedEventData[FIELD_IDS.CAPTAIN]),
      servers: asLinkedRecordIds(selectedEventData[FIELD_IDS.SERVERS]),
      utility: asLinkedRecordIds(selectedEventData[FIELD_IDS.UTILITY]),
      stationCrew: asLinkedRecordIds(selectedEventData[FIELD_IDS.STATION_CREW]),
      chef: asLinkedRecordIds(selectedEventData[FIELD_IDS.CHEF]),
      bartenders: asLinkedRecordIds(selectedEventData[FIELD_IDS.BARTENDERS]),
      displayDesign: asLinkedRecordIds(selectedEventData[FIELD_IDS.DISPLAY_DESIGN]),
      diningCrew: asLinkedRecordIds(selectedEventData[FIELD_IDS.DINING_CREW]),
    });
  }, [selectedEventId, selectedEventData]);

  const canEdit = useMemo(() => Boolean(selectedEventId) && !isLoading, [selectedEventId, isLoading]);

  const toggleMulti = async (key: keyof StaffingSelections, id: string) => {
    if (!selectedEventId) return;
    const current = selections[key] as string[];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setSelections((prev) => ({
      ...prev,
      [key]: next,
    }));

    const fieldMap: Record<keyof StaffingSelections, string> = {
      staff: FIELD_IDS.STAFF,
      captain: FIELD_IDS.CAPTAIN,
      servers: FIELD_IDS.SERVERS,
      utility: FIELD_IDS.UTILITY,
      stationCrew: FIELD_IDS.STATION_CREW,
      chef: FIELD_IDS.CHEF,
      bartenders: FIELD_IDS.BARTENDERS,
      displayDesign: FIELD_IDS.DISPLAY_DESIGN,
      diningCrew: FIELD_IDS.DINING_CREW,
    };

    await setFields(selectedEventId, { [fieldMap[key]]: next });
  };

  const selectSingle = async (key: keyof StaffingSelections, id: string) => {
    if (!selectedEventId) return;
    setSelections((prev) => ({
      ...prev,
      [key]: id,
    }));

    const fieldMap: Record<keyof StaffingSelections, string> = {
      staff: FIELD_IDS.STAFF,
      captain: FIELD_IDS.CAPTAIN,
      servers: FIELD_IDS.SERVERS,
      utility: FIELD_IDS.UTILITY,
      stationCrew: FIELD_IDS.STATION_CREW,
      chef: FIELD_IDS.CHEF,
      bartenders: FIELD_IDS.BARTENDERS,
      displayDesign: FIELD_IDS.DISPLAY_DESIGN,
      diningCrew: FIELD_IDS.DINING_CREW,
    };

    await setFields(selectedEventId, { [fieldMap[key]]: id || null });
  };

  return (
    <section className="bg-gray-900 border-2 border-gray-800 rounded-xl p-5 mb-3 hover:border-red-600 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3">
          <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">▶ Staffing</h2>
        </button>
        {isLoading ? <span className="text-xs text-gray-400">Loading...</span> : null}
      </div>
      {isOpen ? (
        <>
          {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search staff..."
              className="w-full rounded-md bg-gray-950 border border-gray-700 text-gray-300 px-3 py-2"
            />
          </div>
          <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.key} className="border border-gray-800 rounded-lg p-4 bg-black">
            <div className="text-sm font-semibold text-gray-200 mb-3">{section.label}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {staff
                .filter((member) =>
                  searchTerm.trim()
                    ? member.name.toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                )
                .map((member) => {
                const isSelected = section.multi
                  ? (selections[section.key] as string[]).includes(member.id)
                  : selections[section.key] === member.id;
                return (
                  <label
                    key={member.id}
                    className={`flex items-center gap-2 text-sm text-gray-200 border border-gray-800 rounded-md px-3 py-2 cursor-pointer ${
                      isSelected ? "border-red-500" : "hover:border-gray-600"
                    }`}
                  >
                    <input
                      type={section.multi ? "checkbox" : "radio"}
                      name={section.multi ? undefined : String(section.key)}
                      checked={isSelected}
                      disabled={!canEdit}
                      onChange={() =>
                        section.multi
                          ? toggleMulti(section.key, member.id)
                          : selectSingle(section.key, member.id)
                      }
                    />
                    <span>{member.name}</span>
                  </label>
                );
                })}
            </div>
          </div>
        ))}
          </div>
        </>
      ) : null}
    </section>
  );
};
