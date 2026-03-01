# EventOps Auth Setup — Step-by-Step

This guide walks you through setting up Airtable + Vercel serverless authentication.

---

## Step 1: Create the Users Table in Airtable

1. Open your EventOps Airtable base (the same base you use for Events).
2. Click **+ Add or import** → **Create empty table**.
3. Name the table: **Users**.
4. Add these fields:

| Field Name    | Field Type     | Options / Notes                                      |
|---------------|----------------|------------------------------------------------------|
| Email         | Single line text | Primary field (rename from "Name" if needed)       |
| Name          | Single line text | Display name (e.g. "Maria Garcia")                 |
| Role          | Single select   | See options below                                   |
| PasswordHash  | Long text       | Stores salt:hash (do not edit manually)             |

5. For **Role**, add these options (exactly):
   - `ops_admin`
   - `kitchen`
   - `logistics`
   - `intake`
   - `flair`
   - `foh`

6. Copy the **Table ID**:
   - Click the table name → **Customize table** → **API** (or use the table ID from the URL).
   - Or run the base and note the table ID from the Airtable API docs.
   - It looks like `tblXXXXXXXXXXXXXXXX`.

---

## Step 2: Add Users (Admin Workflow)

**For each employee**, add a row in the Users table:

| Field        | Value                          |
|--------------|--------------------------------|
| **Email**    | Their work email               |
| **Name**     | Display name (e.g. Maria Garcia) |
| **Role**     | `flair`, `kitchen`, `ops_admin`, etc. |
| **PasswordHash** | **Leave empty**            |

Tell the employee: *"Go to [your app URL], enter your email, and set your password."*

On first login, they enter their email → the app shows **Set your password** → they create a password and are signed in.

---

## Step 3: (Optional) Pre-set a Password

If you need to set a password manually (e.g. for your own admin account), run:

```bash
node scripts/hashPassword.js "YourPassword123"
```

Copy the output and paste it into the **PasswordHash** field in Airtable. That user can then log in normally without the first-time setup flow.

---

## Step 4: Add Environment Variables in Vercel

1. Go to [vercel.com](https://vercel.com) → your **eventops** project.
2. **Settings** → **Environment Variables**.
3. Add these (use **Production** and **Preview**):

| Name                      | Value                    | Sensitive |
|---------------------------|--------------------------|-----------|
| `AIRTABLE_API_KEY`        | Your Airtable API key     | Yes       |
| `AIRTABLE_BASE_ID`        | Your base ID (app...)    | No        |
| `AIRTABLE_USERS_TABLE`    | Your Users table ID (tbl...) | No    |
| `AUTH_JWT_SECRET`         | A long random string (see below) | Yes  |

**Generate `AUTH_JWT_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `AUTH_JWT_SECRET`.

---

## Step 5: Update vercel.json (if needed)

The `api/` folder at the project root is automatically deployed as serverless functions. No changes to `vercel.json` are required for standard setup.

---

## Step 6: Deploy

1. Push your changes to GitHub.
2. Vercel will auto-deploy.
3. Or run: `vercel --prod`

---

## Step 7: Test Login

**Local development:** Run `vercel dev` (not `npm run dev`) so the auth API is available. Set env vars in `.env.local` or via Vercel CLI.

**Production:** Go to your deployed app (e.g. `eventops-fawn.vercel.app`).

1. You should be redirected to `/login`.
2. **New user (no PasswordHash):** Enter email → click Sign In → Set your password → sign in.
3. **Existing user:** Enter email and password → Sign In.

---

## Troubleshooting

- **"Invalid credentials"**: Email lookup is case-insensitive. If you pre-set a password, check that PasswordHash was generated correctly.
- **"Failed to fetch"**: Check Vercel function logs. Ensure env vars are set and the Users table exists.
- **CORS errors**: The API allows your app origin; if using a custom domain, add it to CORS in the API.
