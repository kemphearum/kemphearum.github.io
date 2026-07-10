# Open Decisions

## OD-001: Formal Firestore Collection Catalog

The current code and indexes identify major collections, but a complete field-by-field catalog should be confirmed against production data before treating the schema documentation as exhaustive.

## OD-002: Firestore Rules Test Location

Project instructions mention `firestore.rules.test.mjs`, but that file was not present in the inspected root listing. Decide whether to add rule tests in a future implementation pass.

## OD-003: Analytics Data Retention Defaults

The admin README describes configurable analytics retention. Confirm the intended production defaults before documenting retention as policy.

## OD-004: Documentation Maintenance Gate

Decide whether pull requests that touch routes, Firestore rules, services, registries, or admin tabs must update the matching phase document before merge.

## OD-005: Public Content Completeness Targets

The roadmap lists future portfolio content areas. Confirm which are current release scope versus backlog before marking all sections as required.

