# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploy to Vercel (live)

1) Push this repo to GitHub.
2) In Vercel: New Project → Import the repo.
3) Framework preset: Vite.
4) Build Command: `npm run build`
5) Output Directory: `dist`
6) Install Command: `npm install`
7) Add Environment Variables (Project Settings → Environment Variables):
	- `VITE_AIRTABLE_API_KEY`
	- `VITE_AIRTABLE_BASE_ID`
	- `VITE_AIRTABLE_EVENTS_TABLE`
	- `OPENAI_API_KEY` (server-side, for invoice AI parsing — optional)
8) Deploy.

## Airtable API Key Setup

Create a token at [Airtable → Developer Hub → Create token](https://airtable.com/create/tokens).

**Required scopes:**
- `data.records:read` — read records
- `data.records:write` — create/update records (stations, events)
- `schema.bases:read` — read table schema (dropdowns, field resolution)

**Ensure the token has access to your base.** If you see 403 errors or "No items found" in the station picker, run:

```bash
node scripts/testAirtableToken.js
```

This tests Meta API, Events, Stations, and Menu Items. Fix any 403s by updating your token scopes or base access.

**Station Presets:** The app uses `/api/airtable/select` (server-side proxy) so the API key stays hidden. Run `npm run dev:full` (vercel dev) locally for the proxy to work. On Vercel, ensure `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are set.

**Optional:** Copy `.env.example` to `.env`. Set `VITE_AIRTABLE_STATION_PRESETS_TABLE` to your table name (e.g. "Station Presets") or leave unset to use the default.

Notes:
- SPA routing is configured via [vercel.json](vercel.json).
- After deployment, open the site and test /quick-intake and /beo-intake to confirm Airtable access.
