# Security and Access Requirements

## Requirements

- Public content reads must be allowed only where rules permit public visibility.
- Admin writes must require authenticated users with appropriate role or custom permission grants.
- Messages, analytics, audit logs, users, sessions, settings, and database operations must be gated.
- Server API routes must validate payload shape before writing to Firestore.
- Secrets and service account details must remain server-only.

## Source

Use `firestore.rules`, `src/server/*`, `src/services/auth/*`, and admin access hooks as enforcement references.

