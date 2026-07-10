# Server Actions and API Routes

## API Routes

- `/api/contact`
- `/api/geo`
- `/api/auth-log`
- `/api/db-sync`
- `/api/analytics`

## Server Modules

Server-only behavior lives in `src/server/authAudit.js`, `contactSubmission.js`, `databaseSync.js`, `firebaseAdmin.js`, `geoLookup.js`, and `scripts/migrationRunner.js`.

## Rule

Keep server-only dependencies and secrets out of client source.

