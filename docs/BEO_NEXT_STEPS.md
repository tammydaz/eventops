# BEOs You Already Have — What to Do Next

## What You Have in the Repo

| Item | Location | What it is |
|------|----------|------------|
| **Full BEO file list** | `docs/beo_file_list.txt` | 500+ paths to Excel BEOs under `beo templates\` (by month/week/date). |
| **Sample BEO list** | `docs/beo_sample_list.txt` | 43 chosen paths (mix of DELIVERY, FS, PICKUP, IN HOUSE, weddings). |
| **Text dump of 43 BEOs** | `docs/BEO_RAW_DUMP.txt` | One big file: each BEO as `=== FILE N: filename ===` then all sheet text. **This is what an agent (or you) can read** — no need to open Excel. |
| **Audit / analysis** | `docs/BEO_ANALYSIS.md` | Findings (spec accuracy, structure, stations, menu naming, etc.) and recommendations. |
| **Extraction script** | `scripts/RunBEOAnalysis.ps1` | Reads `beo_sample_list.txt`, opens each .xlsx, dumps sheet text into `BEO_RAW_DUMP.txt`. |

The Excel files themselves live under **`C:\eventops\beo templates\`** (and subfolders like `05 May 2025\...`, `06 June 2025\...`). The repo does **not** need to store the .xlsx; the **dump is your “uploaded” copy** for validation and agent use.

---

## What to Do Next

### 1. Use the dump for intake → BEO validation (Task 23)

- **Source of truth:** `docs/BEO_RAW_DUMP.txt` (43 events).
- **Steps:**
  1. Pick **3–5 events** from the dump (e.g. one DELIVERY, one Full Service, one with bar/signature drink).
  2. For each, **extract** from the `=== FILE N ... ===` block: client, date, guest count, menu sections (passed apps, buffet, stations, desserts), bar, hydration, coffee, ice, special notes.
  3. **Enter that into the app** (intake or seed event).
  4. **Print BEO** (Kitchen + Server as needed).
  5. **Compare** printed BEO to the same block in `BEO_RAW_DUMP.txt`: missing items, wrong sections, wrong wording.
  6. **Log** discrepancies and fix in the app.

You can do this yourself or ask an agent: *“Use `docs/BEO_RAW_DUMP.txt`. For FILE 1, FILE 2, FILE 5, list what should be entered in intake and what should appear on Kitchen and Server BEO; then we’ll run one event and fix issues.”*

### 2. (Optional) One file per event for agents

- **TODO_MASTER** suggests `docs/old_beos/` with **one file per event** so an agent can “for each file in old_beos, do X.”
- **Right now:** The single dump is enough; an agent can still work section by section (`=== FILE 1 ...`, `=== FILE 2 ...`).
- **If you want one file per event:** Run a script that splits `BEO_RAW_DUMP.txt` by `=== FILE` into `docs/old_beos/event_001.txt` … `event_043.txt`. (A small script can do this; ask if you want it.)

### 3. Add more BEOs later

- Add paths (one per line) to `docs/beo_sample_list.txt` (or keep a separate list).
- From repo root, run:
  ```powershell
  .\scripts\RunBEOAnalysis.ps1
  ```
- This **overwrites** `docs/BEO_RAW_DUMP.txt` with text from every file in the sample list. So: either append new content to the script and merge, or replace the sample list and re-run to get a new dump.

### 4. Other priorities from your TODO

- **Task 22:** When you switch back to the app, verify Hydration + Mimosa Bar (pills, options, server BEO section).
- **Task 21:** Ops Chief — surface signature drink non-standard items when wired to real data.
- **Station config (8–17):** Verify station presets (Tex-Mex, Ramen, etc.) against FoodWerx/Airtable.

---

## Quick Reference

- **“Where are the old BEOs?”** → Content: `docs/BEO_RAW_DUMP.txt`. Paths: `docs/beo_sample_list.txt` (43) or `docs/beo_file_list.txt` (500+).
- **“How do I get text from more Excel BEOs?”** → Add paths to `beo_sample_list.txt`, run `.\scripts\RunBEOAnalysis.ps1`.
- **“How do I validate intake → BEO?”** → Use the dump; pick a few events; enter in app → print → compare to dump; log and fix.
