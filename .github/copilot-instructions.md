# Copilot instructions for eventops

## Big picture
- This Vite app currently renders a static HTML shell in [index.html](index.html) and runs vanilla DOM logic from [src/main.jsx](src/main.jsx). React components in [src/App.jsx](src/App.jsx) and [src/pages/clientIntake.jsx](src/pages/clientIntake.jsx) are present but not wired to the HTML entry yet.
- The UI is built with hard-coded IDs/classes in [index.html](index.html). The JS in [src/main.jsx](src/main.jsx) expects DOM nodes like `eventSelectorButton`, `eventDropdown`, `eventList`, and toggles `.hidden`.

## Data flow & integrations
- Airtable access is centralized in [src/airtable.js](src/airtable.js) with `listEvents()`, `updateEvent()`, and `snapshotEvent()` calling the Airtable REST API.
- Env vars are required for Airtable: `VITE_AIRTABLE_API_KEY` and `VITE_AIRTABLE_BASE` (see [src/airtable.js](src/airtable.js)).

## Styling conventions
- Global utility classes (Tailwind-like) live in [src/index.css](src/index.css) and are heavily used in [index.html](index.html) (e.g., `.bg-gray-900`, `.text-red-600`, `.rounded-md`).
- Feature-specific styles exist in [src/pages/clientIntake.css](src/pages/clientIntake.css) and [src/App.css](src/App.css), but these are not referenced in the current HTML entry.

## Developer workflows
- Start dev server: `npm run dev` (Vite)
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`

## Practical notes for edits
- When adding UI elements, wire them via IDs in [index.html](index.html) and update the DOM handlers in [src/main.jsx](src/main.jsx) so dropdown/search behaviors remain consistent.
- If you move toward React rendering, ensure the Vite entrypoint switches to a React `createRoot` flow and update [index.html](index.html) accordingly; right now it is purely static HTML + DOM scripts.
