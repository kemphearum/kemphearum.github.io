# Logging Standard

## Logging Sources

Logging and audit behavior is split across server API modules, `AuditLogService`, activity context, admin audit screens, Firestore `auditLogs`, and user/session tracking.

## Rules

- Do not log secrets, service account values, tokens, or sensitive environment details.
- Prefer structured audit records for admin and security-sensitive actions.
- Keep client console output out of production code.
- Use admin notification history for user-facing operational feedback, not raw logs.

