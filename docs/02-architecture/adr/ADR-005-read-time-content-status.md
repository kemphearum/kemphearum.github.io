# ADR-005: Compute Effective Content Status at Read Time

## Status

Accepted

## Context

The project supports draft, scheduled, published, and archived content behavior without paid background schedulers.

## Decision

Use `src/domain/shared/contentStatus.js` as the single status lifecycle utility. Store scheduling fields on content records and compute effective status at read time.

## Consequences

- No Cloud Scheduler or background worker is required.
- Public views filter content after computing effective status.
- Admin views can show stored and effective status differences.
- A future scheduler could update stored status without changing the UI contract.

