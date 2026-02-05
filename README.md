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
8) Deploy.

Notes:
- SPA routing is configured via [vercel.json](vercel.json).
- After deployment, open the site and test /quick-intake and /beo-intake to confirm Airtable access.
