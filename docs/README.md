# Portfolio Documentation Program

This directory is the structured documentation baseline for the portfolio application. It is modeled after the ITRMF Management System phase structure and adapted to this repo's React Router 7, Vite, Firebase, Firestore, Vercel, CMS, admin, RBAC, and zero-cost deployment architecture.

## Start Here

- `_program/PROGRAM-OVERVIEW.md`: documentation program purpose and phase map.
- `_program/BASELINE-STATUS.md`: current repository/documentation status.
- `_program/SOURCE-INVENTORY.md`: source files used as the documentation baseline.
- `_program/SYSTEM-TRACEABILITY-MATRIX.md`: capability-to-source traceability.
- `_program/OPEN-DECISIONS.md`: unresolved design and governance decisions.
- `_program/IMPLEMENTATION-READINESS-GATES.md`: gates for future implementation work.

## Phase Map

| Phase | Folder | Purpose |
|---|---|---|
| 0 | `00-foundation/` | Vision, principles, stack, standards, governance, environment, config, security, performance, SEO, accessibility, logging, and error handling |
| 1 | `01-analysis/` | Capabilities, requirements, roles, content models, workflows, security/access, SEO/accessibility, integrations, and traceability |
| 2 | `02-architecture/` | Solution, logical, frontend, admin CMS, Firebase, deployment architecture, ADRs, and diagrams |
| 3 | `03-domain-model/` | Domain areas, content/admin entities, validation rules, and content status lifecycle |
| 4 | `04-database/` | Firestore schema baseline, collections, indexes, rules mapping, and seed/sample data |
| 5 | `05-modules/` | Application modules, public/admin modules, service layer, registry system, and i18n |
| 6 | `06-rbac/` | Roles, permission catalog, Firestore RBAC, and admin access matrix |
| 7 | `07-api/` | API standards, route catalog, server routes, contact/auth/geo/db sync, and error handling |
| 8 | `08-ux/` | Navigation, screen inventory, design system, public/admin UX, accessibility, SEO, wireframes, reports, and screenshots |
| 9 | `09-implementation/` | Roadmap, quality gates, test strategy, and release checklist |
| 9 | `09-migration/` | Firestore seed/import/export, multilingual migration, and database admin operations |
| 9 | `09-implementation-readiness/` | Readiness assessment, conformance backlog, and verification baseline |
| 10 | `10-integration-blueprint/` | Frontend/service/API/Firebase/admin-registry/database-sync integration |
| 11 | `11-implementation/` | Work breakdown, module tracker, release readiness tracker, and documentation maintenance |

## Maintenance Rule

When future changes affect routes, services, domain models, registries, Firestore rules/indexes, server API handlers, deployment config, admin UX, public UX, SEO, accessibility, or data operations, update the matching phase document in the same change.

## Existing Root Docs

Keep this docs program synchronized with root-level project docs:

- `README.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `docs/VERSIONING.md`

