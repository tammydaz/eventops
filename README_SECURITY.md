# Security Fix: .env Removal

## What Happened

The `.env` file containing real API keys and secrets was accidentally committed to the repository. This exposed:

- Airtable API token
- Airtable base and table IDs
- JWT secret
- Other sensitive configuration

## What Was Done

1. **Added `.env` to `.gitignore`** — `.env`, `.env.local`, and `.env.*.local` are now ignored so they cannot be committed again.

2. **Removed `.env` from the repository** — The file was removed from git tracking via `git rm --cached .env`. Your local `.env` was preserved for reference.

3. **Created `.env.example`** — A template with placeholder values. Copy to `.env` and fill in your own credentials:
   ```bash
   cp .env.example .env
   ```

## What You Must Do

1. **Revoke all exposed keys immediately:**
   - [Airtable](https://airtable.com/create/tokens) — Revoke the exposed token and create a new one
   - OpenAI — Revoke and regenerate the API key if it was real
   - Regenerate `AUTH_JWT_SECRET` with a new random value (min 32 chars)

2. **After revoking:** Delete your local `.env` and create a new one from `.env.example` with the new credentials.

3. **Do NOT push** until you have revoked the old keys. The exposed keys may still exist in git history; consider using `git filter-repo` or BFG Repo-Cleaner to purge `.env` from history if the repo was pushed to a remote.

4. **Rotate any other secrets** that were in `.env` (e.g., Google Maps API key if it was set).
