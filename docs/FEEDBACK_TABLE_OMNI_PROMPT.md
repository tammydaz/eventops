# Omni Prompt: Create Airtable Feedback Issues Table

Copy and paste this entire block to an AI assistant (e.g. Omni, Claude, ChatGPT) to create the table:

---

## Task

Create a new Airtable table in my base with the following exact specification. No linked records. All field names must match exactly (case-sensitive).

## Table Name

**Feedback Issues** (exact spelling, with space)

## Fields (create in this order)

| # | Field Name     | Field Type   | Options / Configuration |
|---|----------------|--------------|--------------------------|
| 1 | Type           | Single select| Options (add these exactly): `issue`, `idea`, `bug`, `recommendation` |
| 2 | Screen         | Single line text | — |
| 3 | URL            | Single line text | — |
| 4 | Message        | Long text    | — |
| 5 | UserId         | Single line text | — |
| 6 | UserName       | Single line text | — |
| 7 | UserEmail      | Single line text | — |
| 8 | Status         | Single select| Options: `open`, `resolved`. Default: `open` |
| 9 | ResolvedAt     | Date         | Include time |
| 10| ResolvedBy     | Single line text | — |
| 11| ResolutionNote | Long text    | — |

## Rules

- **No linked records.** UserId, UserName, UserEmail are plain text (the app stores JWT user data as strings).
- **Exact spelling:** Field names are case-sensitive. Use `Type` not `type`, `UserId` not `User ID`.
- **Single select options:** Type and Status must have the exact option values listed. No extra options.
- **Table location:** Create this table in the same base that contains your Events table.

## Summary

- Table: **Feedback Issues**
- 11 fields, all plain text / single select / date
- Nothing linked

---
