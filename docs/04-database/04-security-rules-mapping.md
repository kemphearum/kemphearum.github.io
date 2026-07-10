# Security Rules Mapping

## Source

`firestore.rules` is the authoritative access control map for Firestore data.

## Access Patterns

- Public visitors can read only data allowed by collection rules.
- Signed-in users receive roles from user documents.
- Admin, editor/writer, superadmin/owner, and custom roles receive module capabilities through rule helpers and `rolePermissions`.
- Messages, users, audit logs, analytics, and admin data are restricted.

## Maintenance Rule

Client permission utilities and Firestore rules must stay aligned.

