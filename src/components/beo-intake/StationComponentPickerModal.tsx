import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  loadAllComponentsForPreset,
  loadStationOptionsForPreset
} from '../../services/airtable/stationComponents';
import { isErrorResult } from '../../services/airtable/selectors';

interface StationComponent {
  id: string;
  name: string;
  componentType: string;
  defaultQuantity?: number;
  isDefault: boolean;
}

interface StationOption {
  id: string;
  optionName: string;
  description?: string;
  numberOfSelectionsAllowed: number;
  componentType: string;
  linkedComponentIds?: string[];
}

interface ComponentSelection {
  tempId: string;
  componentId: string;
  quantity: number;
  source: string;
  selected: boolean;
}

export interface ComponentRow {
  id: string;
  componentId: string;
  quantity: string;
  source: string;
  beoSection?: string;
}

interface StationComponentPickerModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (params: { rows: ComponentRow[]; customItems: string }) => void;
  presetId: string;
  presetName: string;
  guestCount?: number;
  initialComponents?: ComponentRow[];
  /** For edit mode / pre-filled custom items */
  initialCustomItems?: string;
}

export function StationComponentPickerModal({
  isOpen,
  onCancel,
  onSave,
  presetId,
  presetName,
  guestCount = 150,
  initialComponents = [],
  initialCustomItems = "",
}: StationComponentPickerModalProps) {
  const [components, setComponents] = useState<StationComponent[]>([]);
  const [options, setOptions] = useState<StationOption[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<Map<string, ComponentSelection>>(new Map());
  const [beoSection, setBeoSection] = useState<string>('Creation Station');
  const [customItems, setCustomItems] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && presetId) {
      loadData();
    }
  }, [isOpen, presetId]);

  // Initialize selections and customItems when modal opens with initial data
  useEffect(() => {
    if (!isOpen) return;
    setCustomItems(initialCustomItems);
    if (initialComponents.length > 0) {
      const newSelections = new Map<string, ComponentSelection>();
      initialComponents.forEach(comp => {
        newSelections.set(comp.componentId, {
          tempId: comp.id,
          componentId: comp.componentId,
          quantity: parseInt(comp.quantity, 10) || 1,
          source: comp.source || 'FoodWerx',
          selected: true
        });
      });
      setSelectedComponents(newSelections);
    } else {
      setSelectedComponents(new Map());
    }
  }, [isOpen, initialComponents, initialCustomItems]);

  // Auto-detect BEO section from preset name
  useEffect(() => {
    if (presetName) {
      if (presetName.includes('Pasta') || presetName.includes('Tex-Mex') ||
          presetName.includes('Ramen') || presetName.includes('Carving') ||
          presetName.includes('Hi Bachi') || presetName.includes('Waffle')) {
        setBeoSection('Creation Station');
      } else if (presetName.includes('Charcuterie') || presetName.includes('Display') ||
                 presetName.includes('Fruit') || presetName.includes('Corner')) {
        setBeoSection('Cocktail Display');
      } else if (presetName.includes('Appetizer')) {
        setBeoSection('Presented Appetizers');
      } else if (presetName.includes('Late Night') || presetName.includes('Donut') ||
                 presetName.includes('Pop-Tart')) {
        setBeoSection('Late Night');
      }
    }
  }, [presetName]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [allComponents, allOptions] = await Promise.all([
        loadAllComponentsForPreset(presetId),
        loadStationOptionsForPreset(presetId)
      ]);

      if (isErrorResult(allComponents)) {
        setError(allComponents.message || 'Failed to load components from Airtable.');
        setComponents([]);
        setOptions([]);
      } else if (!allComponents || allComponents.length === 0) {
        setError('No components found for this station preset. Please configure components in Airtable.');
        setComponents([]);
        setOptions([]);
      } else {
        setError(null);
        setComponents(allComponents);
        setOptions(Array.isArray(allOptions) && !isErrorResult(allOptions) ? allOptions : []);
      }
    } catch (err) {
      console.error('Failed to load preset data:', err);
      setError('Failed to load components. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  function calculateQuantity(component: StationComponent): number {
    const baseQty = component.defaultQuantity ?? 1;

    // Scale based on component type
    const scaleFactor = guestCount / 50;

    if (component.componentType.includes('Sauce') || component.componentType.includes('Topping')) {
      return Math.ceil(baseQty * (guestCount / 100)); // 1 per 100 guests
    } else if (component.componentType.includes('Protein')) {
      return Math.ceil(baseQty * (guestCount / 25)); // 1 per 25 guests
    } else if (component.componentType.includes('Starch') || component.componentType.includes('Vegetable')) {
      return Math.ceil(baseQty * scaleFactor); // 1 per 50 guests
    }

    return Math.ceil(baseQty * scaleFactor);
  }

  function handleAutoFill() {
    const newSelections = new Map<string, ComponentSelection>();

    components.forEach(component => {
      if (component.isDefault) {
        newSelections.set(component.id, {
          tempId: generateTempId(),
          componentId: component.id,
          quantity: calculateQuantity(component),
          source: 'FoodWerx',
          selected: true
        });
      }
    });

    setSelectedComponents(newSelections);
  }

  function handleClearAll() {
    setSelectedComponents(new Map());
  }

  function toggleComponent(componentId: string) {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const newSelections = new Map(selectedComponents);

    if (newSelections.has(componentId)) {
      newSelections.delete(componentId);
    } else {
      if (!canAddComponent(componentId)) {
        const opt = getOptionForComponentType(component.componentType);
        alert(`You can only select ${opt?.numberOfSelectionsAllowed} ${component.componentType} items`);
        return;
      }

      newSelections.set(componentId, {
        tempId: generateTempId(),
        componentId,
        quantity: calculateQuantity(component),
        source: 'FoodWerx',
        selected: true
      });
    }

    setSelectedComponents(newSelections);
  }

  function updateQuantity(componentId: string, quantity: number) {
    const newSelections = new Map(selectedComponents);
    const existing = newSelections.get(componentId);

    if (existing) {
      newSelections.set(componentId, {
        ...existing,
        quantity: Math.max(1, quantity)
      });
      setSelectedComponents(newSelections);
    }
  }

  function canAddComponent(componentId: string): boolean {
    const component = components.find(c => c.id === componentId);
    if (!component) return false;

    const option = getOptionForComponentType(component.componentType);
    if (!option) return true;

    const currentCount = Array.from(selectedComponents.keys()).filter(id => {
      const comp = components.find(c => c.id === id);
      return comp && comp.componentType === component.componentType;
    }).length;

    return currentCount < option.numberOfSelectionsAllowed;
  }

  function getOptionForComponentType(componentType: string): StationOption | undefined {
    return options.find(opt =>
      opt.componentType === componentType ||
      componentType.includes(opt.componentType)
    );
  }

  function groupComponentsByType(): Map<string, StationComponent[]> {
    const grouped = new Map<string, StationComponent[]>();

    components.forEach(component => {
      const type = component.componentType || 'Other';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(component);
    });

    return grouped;
  }

  function getSelectedCountForType(type: string): number {
    return Array.from(selectedComponents.keys()).filter(id => {
      const comp = components.find(c => c.id === id);
      return comp && comp.componentType === type;
    }).length;
  }

  function handleSave() {
    const rows: ComponentRow[] = Array.from(selectedComponents.entries()).map(([, data]) => ({
      id: data.tempId,
      componentId: data.componentId,
      quantity: data.quantity.toString(),
      source: data.source,
      beoSection: beoSection
    }));

    onSave({ rows, customItems });
    onCancel();
  }

  function generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  if (!isOpen) return null;

  const groupedComponents = groupComponentsByType();

  const hasAnyItems = selectedComponents.size > 0;
  const addButtonStyle = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "rgba(255,107,107,0.15)",
    color: "#ff6b6b",
    fontSize: "11px",
    fontWeight: 600,
    cursor: (loading || components.length === 0) ? "not-allowed" : "pointer",
    opacity: (loading || components.length === 0) ? 0.5 : 1,
  };
  const clearButtonStyle = {
    ...addButtonStyle,
    borderColor: "#666",
    color: "#a0a0a0",
    opacity: !hasAnyItems ? 0.5 : 1,
    cursor: !hasAnyItems ? "not-allowed" : "pointer",
  };

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".station-picker-modal")) return;
        onCancel();
      }}
    >
      <div
        className="station-picker-modal"
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "2px solid #ff6b6b",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "bold", color: "#e0e0e0", padding: "16px 16px 0" }}>
          Configure Station: {presetName}
        </h2>

        {/* Auto-Fill row — matches plates/cutlery/glassware */}
        <div style={{ marginBottom: 12, padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={handleAutoFill} disabled={loading || components.length === 0} style={addButtonStyle}>
            Auto-Fill FoodWerx Defaults
          </button>
          <button type="button" onClick={handleClearAll} disabled={!hasAnyItems} style={clearButtonStyle}>
            Clear All & Start Over
          </button>
          {guestCount > 0 && (
            <span style={{ marginLeft: 12, fontSize: 12, color: "#888" }}>
              ({guestCount} guests)
            </span>
          )}
        </div>

        {/* BEO Section Selector */}
        <div style={{ padding: "0 16px 12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "4px", fontWeight: 600 }}>
            Display As (BEO Section)
          </label>
          <select
            value={beoSection}
            onChange={(e) => setBeoSection(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "rgba(0,0,0,0.25)",
              color: "#e0e0e0",
              fontSize: "13px",
            }}
          >
            <option value="Presented Appetizers">Presented Appetizers</option>
            <option value="Creation Station">Creation Station</option>
            <option value="Cocktail Display">Cocktail Display</option>
            <option value="Passed Hors d'oeuvres">Passed Hors d'oeuvres</option>
            <option value="Plated Appetizer">Plated Appetizer</option>
            <option value="Plated Entree">Plated Entree</option>
            <option value="Plated Dessert">Plated Dessert</option>
            <option value="Buffet">Buffet</option>
            <option value="Late Night">Late Night</option>
            <option value="Enhancement Station">Enhancement Station</option>
          </select>
        </div>

        {/* Component Groups */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Loading components...
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', backgroundColor: '#dc2626', color: '#fff', borderRadius: '4px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {!loading && !error && components.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              No components configured for this station. Please add components in Airtable.
            </div>
          )}

          {!loading && components.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from(groupedComponents.entries()).map(([type, comps]) => {
                const option = getOptionForComponentType(type);
                const selectedCount = getSelectedCountForType(type);

                return (
                  <div key={type} style={{ border: "1px solid #444", borderRadius: "6px", padding: "12px", marginBottom: "12px" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                        {type}
                      </h3>
                      {option && (
                        <span style={{ fontSize: '0.875rem', color: '#60a5fa' }}>
                          {option.optionName} ({selectedCount}/{option.numberOfSelectionsAllowed})
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {comps.map(component => {
                        const selection = selectedComponents.get(component.id);
                        const isSelected = !!selection;
                        const canAdd = canAddComponent(component.id);

                        return (
                          <div
                            key={component.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "12px",
                              backgroundColor: isSelected ? "#2a3a2a" : "#2a2a2a",
                              border: `1px solid ${isSelected ? "#22c55e" : "#444"}`,
                              borderRadius: "6px",
                              cursor: (!isSelected && !canAdd) ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                            }}
                            onClick={() => (isSelected || canAdd) && toggleComponent(component.id)}
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleComponent(component.id)}
                                disabled={!isSelected && !canAdd}
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  cursor: (!isSelected && !canAdd) ? "not-allowed" : "pointer",
                                }}
                              />
                            </div>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, fontSize: "14px", color: "#e0e0e0" }}>
                              {isSelected && <span style={{ color: "#22c55e" }}>✓</span>}
                              {component.name}
                              {component.isDefault && (
                                <span style={{ marginLeft: "4px", fontSize: "11px", color: "#888" }}>
                                  (default)
                                </span>
                              )}
                            </span>
                            {isSelected && selection && (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                                <label style={{ fontSize: "11px", color: "#888" }}>Qty:</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={selection.quantity}
                                  onChange={(e) => updateQuantity(component.id, parseInt(e.target.value, 10) || 1)}
                                  style={{
                                    width: "4rem",
                                    padding: "5px 8px",
                                    fontSize: "12px",
                                    borderRadius: "5px",
                                    border: "1px solid #444",
                                    backgroundColor: "#1a1a1a",
                                    color: "#e0e0e0",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Items */}
        <div style={{ padding: "16px", borderTop: "1px solid #444" }}>
          <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "4px", fontWeight: 600 }}>
            Custom Items (text)
          </label>
          <textarea
            value={customItems}
            onChange={(e) => setCustomItems(e.target.value)}
            placeholder="Additional custom items..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "rgba(0,0,0,0.25)",
              color: "#e0e0e0",
              fontSize: "13px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Footer — matches MenuPickerModal Done button */}
        <div style={{ padding: "16px", borderTop: "1px solid #ff6b6b", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#333",
              color: "#a0a0a0",
              border: "1px solid #555",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              background: "rgba(255,107,107,0.2)",
              color: "#ff6b6b",
              border: "2px solid #ff6b6b",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Confirm & Add Station
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
