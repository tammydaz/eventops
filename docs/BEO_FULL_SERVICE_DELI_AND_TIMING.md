# Full-Service BEOs with Sandwich Platters / DELI — How They Print and When to Serve

**Correction:** The Howard & Jane wedding BEO (052425-7) does **not** have sandwiches; the text dump was misleading due to Excel column alignment. Do not use the dump alone to decide which FS BEOs have DELI/sandwich platters — check the actual BEO.

From the BEOs in the repo (`BEO_RAW_DUMP.txt` and sample list), here’s how **full-service** events that have **DELI** (sandwich platters) are laid out, what other sections they have, and what (if any) notes tell the server **when** to put food out. This matters because the BEO is “4 fold” — one document for kitchen, pack-out, service placement, and timing — and timing is often the least explicit.

---

## 1. Full-service BEOs that have DELI or sandwich platters

**Important:** The repo’s BEO dump (`BEO_RAW_DUMP.txt`) was exported from Excel; columns are shifted or merged, so a “DELI” label in the dump does **not** always mean that row has sandwich items. Text that appears next to “DELI - CHINA/METAL” in the dump can be from other sections (e.g. pasta, buffet).

- **Howard & Jane Wedding MCH FS (File 39):** In the dump, “DELI - CHINA/METAL” appears next to “Grated Parmesan Cheese”, “Roasted Pork Spring Rolls”, and Pasta Flight items — those are **not** sandwiches. On the **actual** Howard & Jane BEO there are **no** sandwich platters; the dump is misleading. **Do not** treat this BEO as having a DELI sandwich section.
- Other full-service files (e.g. Rox Wedding, Javier & Lourdes, Ashley & Paul) show a “DELI” or “DELI - CHINA/METAL” **header** in the dump, but the rows that follow are often notes, addresses, or items from other sections because of column alignment. So the dump **cannot** be used to reliably list which FS BEOs actually have sandwich platters under DELI.

**What we can say:**

- When a full-service BEO **does** have a real sandwich/DELI section, it is **its own section** (DELI or DELI - CHINA/METAL), not under Passed App, Presented App, or Buffet.
- To know which FS BEOs actually have sandwiches, you need to look at the **actual** BEO (the .xlsx), not the text dump. The dump is useful for section headers and vessel labels, but not for trusting “what’s under DELI.”

---

## 2. How the server knows when to put food out (what’s in the notes)

Across the full-service BEOs (including those with DELI), **timing is scattered**; there is no single “serve order” or “all food out at once” block.

### What appears in the dump

- **Time markers** appear as standalone rows or mixed into other columns: e.g. `2pm`, `3PM`, `5pm`, `10pm`, `12:30PM`, `5:30PM`, `8PM`, `10:00PM`, `12PM`, `2:30PM`, `RECEPTION STARTS`, `RECEPTION ENDS`, `CEREMONY`, `STAFF ARRIVAL`, `BAND ARRIVAL`, `BAR OPEN`, `FLIP FOR DESSERT`, `LOAD UP // ROLL OUT`, `SERVER ON SITE UNTIL THIS POINT`.
- **Explicit “when” guidance** in notes (from the analysis and dump):
  - **File 27 (Teamsters):** “MEETING STARTS AT 11AM, WANTS FOOD READY 10-10:15AM” → **all food ready at once** for 10–10:15.
  - **File 28 (Monica Choi):** “5PM”, “8:30PM” near items → suggests different waves (e.g. apps at 5, something at 8:30).
  - **Rox Wedding (22):** “2pm”, “5pm”, “10pm” and “ASSEMBLE ON SITE”, “SEND DESSERTS IN METAL - CHEF TO PLATTER ON SITE” → times exist but are not clearly tied to “Passed at 2, Buffet at 5, Dessert at 10” in one place.
- There is **no** phrase in the dump like “all food out at once” or “DELI out with buffet” for the DELI section specifically. So:
  - **When** DELI (sandwich platters) goes out is **not** stated in a single, clear sentence.
  - Servers infer from: section order on the BEO, time rows, and experience (e.g. “DELI - CHINA/METAL” often with buffet-style service → may go out with or after buffet).

So: the BEO **does** tell the server **where** (section) and **what vessel** (CHINA/METAL), but **when** to put DELI out relative to passed apps, buffet, dessert is **not** consistently spelled out in the notes; it’s implied by times and layout.

---

## 3. Why this is confusing: the BEO is “4 fold”

The BEO is used for several different things at once:

| “Fold” | Purpose | What the BEO provides today |
|--------|---------|-----------------------------|
| **1. Kitchen / production** | What to make, how much | Section names + item rows + quantities. DELI section = make these platters/sandwiches. |
| **2. Pack-out / vessels** | What to send in (metal, china, disposable) | Section suffix: **DELI - CHINA/METAL**, PASSED APPS - METAL, BUFFET - CHINA, etc. |
| **3. Service placement** | Where it goes (which station/table) | Section title = where: Passed Apps, Presented App, Buffet, **DELI**, Dessert. So the server knows DELI is its own station, not “in” passed or buffet. |
| **4. Timing** | When to put each part out | **Weakest.** Times and phrases (2pm, 5pm, RECEPTION STARTS, FLIP FOR DESSERT, “food ready 10-10:15”) appear but are not in one clear timeline; nothing specifically says when DELI goes out vs. passed/buffet/dessert. |

So the confusion is: DELI **does** print in a clear place (its own section, with vessel), so the server knows **what** and **where**, but the same BEO does **not** give a single, obvious “when” for DELI (or “all food out at once” vs. waves). That “when” is what you’re missing for the server.

---

## 4. Summary for the app

- **How it prints on the BEO:**  
  Full-service events that have sandwich platters should show a **DELI - CHINA/METAL** (or similar) **section**, with platter name(s) and sub-items, **in addition to** Passed Appetizers, Presented Appetizers, Buffet, Dessert. So DELI is **not** under Passed/Presented/Buffet; it’s its own block.

- **What the BEOs do *not* give today:**  
  No explicit note in the analyzed BEOs says “all food out at once” or “DELI out at [time]” or “serve DELI with buffet.” Timing is in scattered times and notes; the app could improve this by:
  - Adding a **Timeline** block (you already have one) with clear phases (e.g. Cocktail / Passed & Presented → Buffet & DELI → Dessert), and/or
  - A **service note** field where the client can say “all food out at once” or “DELI with buffet at 6pm,” and printing that in a visible place (e.g. NOTES or SPECIAL NOTES) so the server gets direct guidance.

- **Next steps for you:**  
  1. Add a **DELI - CHINA/METAL** section to the full-service BEO in the app (so platters print like the real BEOs).  
  2. Optionally add a **when-to-serve** cue (e.g. timeline phase or service note) so the server knows when to put DELI (and everything else) out — and so the “4 fold” doc also covers timing clearly.
