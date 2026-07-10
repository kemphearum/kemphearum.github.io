# Database Admin Operations

## Database Management Center

The admin database module provides health checks, archive/restore, CSV import/export, collection exploration, monitoring, asset analytics, and sync controls while staying within the zero-cost architecture.

## DatabaseService Constraints

- Health checks scan known collections and estimate size from samples.
- Batch operations use chunks below Firestore's 500-operation limit.
- Archive collections include operational data such as visits, daily usage, logs, and draft content.
- Database metadata is read from Firebase app configuration and browser connectivity.

## Security Controls

Database operations must be permission-gated, audited, and resilient to quota errors. Restore/import actions must not silently bypass Firestore rules or overwrite data without clear user confirmation.

