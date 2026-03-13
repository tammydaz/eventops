# Kitchen BEO Print Layout — Full Code Reference

This document contains the complete Kitchen BEO print layout code from `BeoPrintPage.tsx`.

---

## 1. Print CSS (lines 125–323)

```css
const printStyles = `
  @media print {
    .beo-print-content {
      display: block !important;
      color: #000 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 8.5in !important;
      max-width: 8.5in !important;
      padding: 0.5in !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      font-size: 14pt !important;
      overflow: visible !important;
      min-height: 11in !important;
      height: auto !important;
      max-height: none !important;
    }
    .beo-page, .print-page, .kitchen-beo-page, .page {
      display: block !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 8.5in !important;
      min-height: 11in !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .kitchen-beo-page {
      width: 8.5in;
      min-height: auto !important;
      margin: 0 auto;
      padding: 0.35in 0.35in 0.4in 0.35in;
      display: block !important;
      page-break-after: auto;
      break-after: auto;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
    .kitchen-beo-page:last-child { break-after: auto; }
    .kitchen-beo-page,
    .beo-print-content,
    .print-page {
      display: block !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
    }
    .beo-section-card {
      margin: 0.12in 0 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      overflow: visible !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .beo-banner-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
  @page {
    size: 8.5in 11in;
    margin: 0.4in;
    margin-top: 2in;
    @top-center {
      font-size: 18pt;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.05em;
    }
  }
  @page :first {
    margin-top: 0.4in;
    @top-center {
      content: none;
    }
  }
`;
```

---

## 2. Inline Styles Object (styles.page, sectionCard, banners)

```ts
const styles = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    width: "8.5in",
    maxWidth: "8.5in",
    minHeight: "11in",
    margin: "0 auto",
    padding: "0",
    background: "#fff",
    color: "#000",
    boxSizing: "border-box" as const,
  },
  sectionCard: {
    background: "#fff",
    border: "2px solid #000",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "visible" as const,
  },
  sectionHeader: {
    background: "transparent",
    color: "#000",
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    textAlign: "center" as const,
    marginTop: 2,
    marginBottom: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  allergyBanner: {
    background: "#ffe5e5",
    color: "#c41e3a",
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 6,
    border: "2px solid #ff0000",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  notBuffetBanner: { /* ... */ },
  religiousBanner: { /* ... */ },
  beoNotesBanner: { /* ... */ },
};
```

---

## 3. Pagination Logic (lines 2735–2829)

```ts
const LINES_PER_PAGE_FIRST = isDelivery ? 52 : 48;
const LINES_PER_PAGE = isDelivery ? 55 : 48;
const SECTION_HEADER_LINES = 2;
const MIN_LINES_ON_LAST_PAGE = 4;

type KitchenPage = {
  pageNum: number;
  sections: Array<{
    section: SectionData;
    items: MenuLineItem[];
    isContinuation?: boolean;
  }>;
};

const kitchenPages: KitchenPage[] = (() => {
  const pages: KitchenPage[] = [];
  let current: KitchenPage = { pageNum: 1, sections: [] };
  let linesUsed = 0;
  const getMaxLines = (pageNum: number) =>
    pageNum === 1 ? LINES_PER_PAGE_FIRST : LINES_PER_PAGE;
  const getItemLines = (item: MenuLineItem) => expandItemToRows(item).length;

  for (const section of activeSections) {
    const sectionLines =
      SECTION_HEADER_LINES +
      section.items.reduce((s, item) => s + getItemLines(item), 0);
    const maxLines = getMaxLines(current.pageNum);

    // If whole section doesn't fit on current page and we have content, start new page
    if (linesUsed + sectionLines > maxLines && current.sections.length > 0) {
      pages.push(current);
      current = { pageNum: pages.length + 1, sections: [] };
      linesUsed = 0;
    }

    let remainingItems = [...section.items];
    let isFirstChunkOfSection = true;

    while (remainingItems.length > 0) {
      const max = getMaxLines(current.pageNum);
      const headerLines = isFirstChunkOfSection ? SECTION_HEADER_LINES : 0;

      let itemsToAdd: MenuLineItem[] = [];
      let chunkLines = headerLines;
      for (const item of remainingItems) {
        const itemLines = getItemLines(item);
        if (linesUsed + chunkLines + itemLines > max && itemsToAdd.length > 0)
          break;
        if (
          linesUsed + chunkLines + itemLines > max &&
          current.sections.length === 0
        ) {
          itemsToAdd.push(item);
          chunkLines += itemLines;
          break;
        }
        itemsToAdd.push(item);
        chunkLines += itemLines;
      }

      if (itemsToAdd.length === 0) {
        pages.push(current);
        current = { pageNum: pages.length + 1, sections: [] };
        linesUsed = 0;
        continue;
      }

      current.sections.push({
        section,
        items: itemsToAdd,
        isContinuation: !isFirstChunkOfSection,
      });
      linesUsed += chunkLines;
      remainingItems = remainingItems.slice(itemsToAdd.length);
      isFirstChunkOfSection = false;

      if (remainingItems.length > 0) {
        pages.push(current);
        current = { pageNum: pages.length + 1, sections: [] };
        linesUsed = 0;
      }
    }
  }
  if (current.sections.length > 0) pages.push(current);
  let result = pages.length > 0 ? pages : [{ pageNum: 1, sections: [] }];

  // Merge last page into previous if it has fewer than MIN_LINES_ON_LAST_PAGE lines
  while (result.length >= 2) {
    const last = result[result.length - 1];
    const lastLines = last.sections.reduce(
      (sum, { section, items, isContinuation }) =>
        sum +
        (isContinuation ? 0 : SECTION_HEADER_LINES) +
        items.reduce((s, item) => s + getItemLines(item), 0),
      0
    );
    if (lastLines >= MIN_LINES_ON_LAST_PAGE) break;
    const prev = result[result.length - 2];
    const prevLines = prev.sections.reduce(
      (sum, { section, items, isContinuation }) =>
        sum +
        (isContinuation ? 0 : SECTION_HEADER_LINES) +
        items.reduce((s, item) => s + getItemLines(item), 0),
      0
    );
    const prevMax = getMaxLines(prev.pageNum);
    if (prevLines + lastLines <= prevMax) {
      prev.sections.push(...last.sections);
      result = result.slice(0, -1);
    } else break;
  }
  return result;
})();
```

---

## 4. Main Kitchen BEO JSX Structure (lines 3172–3440)

```tsx
{topTab === "kitchenBEO" && (
  <div
    key={`kitchen-${leftCheck}`}
    className="beo-print-content"
    style={styles.page}
    onClick={() => { if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur(); }}
  >
    {kitchenPages.length === 0 || (kitchenPages.length === 1 && kitchenPages[0].sections.length === 0) ? (
      <div style={{ padding: 32, textAlign: "center", color: "#999", fontSize: 16 }}>
        No menu items assigned to this event yet.
      </div>
    ) : (
      kitchenPages.map((page, pageIdx) => (
        <div
          key={page.pageNum}
          className="kitchen-beo-page print-page page"
          style={{
            pageBreakAfter: pageIdx < kitchenPages.length - 1 ? "page" : "auto",
          }}
        >
          {/* Grey bar + client/order details — header only on page 1 */}
          {page.pageNum === 1 && (
            <>
              <div className="beo-letterhead-bar kitchen-beo-page-header" style={{...}}>
                BEO | ORDER #: {jobNumberDisplay} — DISPATCH TIME: {dispatchTime}
              </div>
              <div className="beo-event-details-table">
                <table>CLIENT, CONTACT, ORDER #, EVENT DATE</table>
              </div>
            </>
          )}

          {/* Banner container — only on page 1, only when at least one banner has content */}
          {page.pageNum === 1 && (beoNotes.trim() || notBuffetBanner || allergies || religiousRestrictions.trim()) && (
            <div className="beo-banner-container">
              {beoNotes.trim() && <div className="beo-banner-block">📋 BEO NOTES</div>}
              {notBuffetBanner && <div className="beo-banner-block">{notBuffetBanner}</div>}
              {allergies && <div className="beo-banner-block">⚠️ ALLERGIES</div>}
              {religiousRestrictions.trim() && <div className="beo-banner-block">🕎 RELIGIOUS</div>}
            </div>
          )}

          {/* Menu Sections */}
          {page.sections.map(({ section, items: sectionItems, isContinuation }, secIdx) => (
            <div key={...} className="beo-section-card" style={styles.sectionCard}>
              <div className="beo-section-header">
                ● {section.title}{isContinuation ? " (cont.)" : ""} ●
              </div>
              {/* First item + checkbox/spec/packout row */}
              {/* Remaining items */}
            </div>
          ))}

          {/* Last page only: Allergy banner + footer */}
          {pageIdx === kitchenPages.length - 1 && !["packout", "expeditor", "server"].includes(leftCheck) && (
            <>
              {allergies && <div className="beo-banner-block">⚠️ ALLERGIES</div>}
              <div className="beo-footer-block">
                Client, Guests, Job #, Dispatch
                ***end of event***
              </div>
            </>
          )}
        </div>
      ))
    )}

    {/* Server BEO 2nd page (packout/expeditor/server only) */}
    {(leftCheck === "packout" || leftCheck === "expeditor" || leftCheck === "server") && (
      <div className="kitchen-beo-page print-page page">
        <div className="beo-letterhead-bar">BEO</div>
        <div className="kitchen-beo-page2-buffer" style={{ height: "10in", minHeight: "10in" }} />
        <ServerBeo2ndPageContent ... />
      </div>
    )}
  </div>
)}
```

---

## 5. DOM Hierarchy Summary

```
.beo-print-content (styles.page)
├── [empty state] OR
└── kitchenPages.map(page =>
    .kitchen-beo-page.print-page.page
    ├── [page 1 only] .beo-letterhead-bar + .beo-event-details-table
    ├── [page 1 only] .beo-banner-container
    │   ├── .beo-banner-block (BEO NOTES)
    │   ├── .beo-banner-block (not buffet)
    │   ├── .beo-banner-block (allergies)
    │   └── .beo-banner-block (religious)
    ├── page.sections.map(section =>
    │   .beo-section-card
    │   ├── .beo-section-header
    │   └── .beo-menu-item-block (items)
    └── [last page only] .beo-banner-block + .beo-footer-block
)
[packout/expeditor/server only] .kitchen-beo-page
├── .beo-letterhead-bar
├── .kitchen-beo-page2-buffer (10in)
└── ServerBeo2ndPageContent
```

---

## File Location

All of the above lives in: **`src/pages/BeoPrintPage.tsx`**
