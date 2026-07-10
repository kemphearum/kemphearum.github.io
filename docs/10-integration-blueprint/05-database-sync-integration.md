# Database Sync Integration

## Current Design

`src/server/databaseSync.js` verifies a Firebase ID token server-side, checks the requester against the superadmin email allowlist, and dispatches a GitHub repository event using `GITHUB_DISPATCH_TOKEN`.

## Security Controls

- No GitHub token is exposed to the client.
- Local development can bypass sync when service account configuration is missing.
- Non-superadmin callers receive a forbidden response.
- GitHub dispatch failures are mapped to safe error responses.

## Operational Rule

Database sync should remain a privileged operation initiated through the admin database module and audited as part of database operations.

