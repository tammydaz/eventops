# Feedback / Issues Setup

Right-click feedback (Report Issue, Share Idea, Report Bug, Recommendation) is saved to Airtable and viewable via **My Issues** in the sidebar.

## 1. Create Airtable Table

Create a new table in your EventOps Airtable base with these fields:

| Field Name     | Type          | Options / Notes                                      |
|----------------|---------------|------------------------------------------------------|
| Type           | Single select | Options: `issue`, `idea`, `bug`, `recommendation`   |
| Screen         | Single line   |                                                      |
| URL            | Single line   |                                                      |
| Message        | Long text     |                                                      |
| UserId         | Single line   | Airtable user record ID from auth                    |
| UserName       | Single line   |                                                      |
| UserEmail      | Single line   |                                                      |
| Status         | Single select | Options: `open`, `resolved` (default: `open`)       |
| ResolvedAt     | Date          | Include time                                        |
| ResolvedBy     | Single line   |                                                     |
| ResolutionNote | Long text     |                                                     |

## 2. Environment Variable

Add to Vercel (or `.env` for local dev):

```
AIRTABLE_FEEDBACK_TABLE=tblXXXXXXXXXXXXXX
```

Use the table ID from Airtable's URL when viewing the table, or from the API docs.

## 3. How It Works

- **Employees** right-click anywhere → choose an option → describe → Submit. Issues are saved with their user ID.
- **My Issues** (sidebar) shows each user their own issues. Ops admins see all issues.
- **Resolve**: Ops admins can mark issues as resolved with an optional note.
- **Resolved notification**: When a user visits My Issues after their issues were resolved, they see a banner: "X issues resolved since your last visit."

## 4. Auth

The feedback API uses the same JWT as login. Ensure users are signed in when submitting feedback.
