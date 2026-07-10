# ADR-003: Treat Firestore Rules as Authoritative RBAC

## Status

Accepted

## Context

The admin UI computes permissions for user experience and navigation, but Firestore rules are the final enforcement boundary for Firestore data access.

## Decision

Firestore rules remain authoritative for protected data. Client-side permission checks are advisory and must stay aligned with rule behavior.

## Consequences

- Changes to roles, modules, custom permissions, or protected collections require Firestore rules review.
- UI-only gates are not sufficient for security.
- Future rules tests should be added or located to reduce RBAC regression risk.

