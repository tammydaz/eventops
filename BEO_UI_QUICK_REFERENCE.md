# Quick Reference: Apply FormSection to Remaining Sections

## 🎯 8 Sections Left to Refactor

1. MenuSection
2. BarServiceSection  
3. HydrationStationSection
4. CoffeeTeaSection
5. ServicewareSection
6. DietaryNotesSection
7. DesignerNotesSection
8. LogisticsSection

---

## ⚡ Copy-Paste Template

### Step 1: Add Import
```typescript
import { FormSection } from "./FormSection";
```

### Step 2: Remove `isOpen` State
```typescript
// DELETE THIS LINE:
const [isOpen, setIsOpen] = useState(true);
```

### Step 3: Replace Section Wrapper

**OLD CODE (Delete):**
```tsx
<section className="border-2 border-red-600 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm">
  <div className="flex items-center justify-between mb-4">
    <button
      type="button"
      onClick={() => setIsOpen((prev) => !prev)}
      className="text-left flex-1 hover:text-red-400 transition flex items-center gap-3"
    >
      <h2 className="text-lg font-black text-red-600 tracking-wider uppercase">
        ▶ Section Title
      </h2>
    </button>
  </div>
  
  {isOpen && (
    <div className="...your content classes...">
      {/* Your existing form content */}
    </div>
  )}
</section>
```

**NEW CODE (Replace with):**
```tsx
<FormSection title="Section Title" variant="primary">
  <div className="...your content classes...">
    {/* Your existing form content - KEEP AS IS */}
  </div>
</FormSection>
```

### Step 4: Add Focus Rings (Optional but Recommended)

For **primary** sections (red):
```typescript
className="... focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
```

For **secondary** sections (cyan):
```typescript
className="... focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
```

---

## 📋 Recommended Variants

| Section | Variant | Reason |
|---------|---------|--------|
| MenuSection | `secondary` | Supporting menu data |
| BarServiceSection | `primary` | Core service offering |
| HydrationStationSection | `secondary` | Supporting beverage |
| CoffeeTeaSection | `secondary` | Supporting beverage |
| ServicewareSection | `secondary` | Supporting logistics |
| DietaryNotesSection | `primary` | Critical safety info |
| DesignerNotesSection | `secondary` | Supporting notes |
| LogisticsSection | `secondary` | Supporting logistics |

---

## 🚀 Example: MenuSection Refactor

**BEFORE:**
```typescript
export const MenuSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  const [isOpen, setIsOpen] = useState(true);
  const [customs, setCustoms] = useState({ /* ... */ });
  
  // ... useEffect and handlers ...
  
  return (
    <section className="border-2 border-cyan-500 rounded-xl p-5 mb-3 transition-all backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setIsOpen(v => !v)} className="...">
          <h2 className="text-lg font-black text-cyan-400 tracking-wider uppercase">
            ▶ Menu Sections
          </h2>
        </button>
      </div>
      {isOpen && (
        <div className="space-y-4">
          {/* Your content */}
        </div>
      )}
    </section>
  );
};
```

**AFTER:**
```typescript
import { FormSection } from "./FormSection"; // ADD THIS

export const MenuSection = () => {
  const { selectedEventId, selectedEventData, setFields } = useEventStore();
  // REMOVE: const [isOpen, setIsOpen] = useState(true);
  const [customs, setCustoms] = useState({ /* ... */ });
  
  // ... useEffect and handlers UNCHANGED ...
  
  return (
    <FormSection title="Menu Sections" variant="secondary">
      <div className="space-y-4">
        {/* Your content - EXACTLY THE SAME */}
      </div>
    </FormSection>
  );
};
```

---

## ⚠️ What NOT to Change

- **DO NOT** modify any `useState` for form data
- **DO NOT** change `useEffect` hooks
- **DO NOT** modify `handleFieldChange` or save logic
- **DO NOT** change FIELD_IDS or field names
- **DO NOT** alter the content inside the sections

**ONLY CHANGE:** The outer wrapper and collapse logic.

---

## ✅ Testing Checklist

After refactoring each section:

1. ✓ Section still loads data correctly
2. ✓ Inputs save to Airtable on change
3. ✓ Section can collapse/expand
4. ✓ No console errors
5. ✓ Visual style matches other refactored sections
6. ✓ Focus rings appear on input focus (if added)

---

## 🎨 Visual Verification

After refactoring, the section should:
- Have rounded corners (not sharp edges)
- Be centered on page (not full-width)
- Have a subtle shadow
- Show a gradient header
- Rotate arrow icon on collapse
- Have hover animation on header

---

## 🔧 Troubleshooting

**Issue:** Section won't collapse
**Fix:** Make sure you removed the local `isOpen` state

**Issue:** Wrong color accent
**Fix:** Change `variant="primary"` to `variant="secondary"` or vice versa

**Issue:** Content looks squished
**Fix:** Check that you kept all inner div className props

**Issue:** Data not saving
**Fix:** Verify you didn't modify the `setFields` calls or `onChange` handlers

---

## 📦 Complete in 5 Minutes

1. Open each section file
2. Add `import { FormSection } from "./FormSection";`
3. Delete `const [isOpen, setIsOpen] = useState(true);`
4. Find the `<section>` wrapper
5. Replace with `<FormSection title="..." variant="...">`
6. Keep everything inside the `<div className="...">` exactly as is
7. Save and test

Done! 🎉
