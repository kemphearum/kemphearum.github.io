# Portfolio Documentation Program Overview

## Purpose

This documentation program gives the portfolio repository a phase-based design baseline similar to the ITRMF documentation structure, adapted to a React Router 7, Vite, Firebase, and Vercel portfolio CMS.

## System Context

The system is a public cybersecurity and governance portfolio plus a private admin CMS. Public content is rendered from React routes and sections, while content and admin operations flow through domain normalizers, services, registries, context providers, and Firestore.

## Documentation Phases

- Phase 0: Foundation, standards, and operating constraints.
- Phase 1: Requirements, content capabilities, roles, workflows, integrations, and traceability.
- Phase 2: Solution, frontend, admin, Firebase, and deployment architecture.
- Phase 3: Domain model and content lifecycle.
- Phase 4: Firestore schema, indexes, rules, and seed data.
- Phase 5: Application modules and shared services.
- Phase 6: RBAC and admin access model.
- Phase 7: React Router routes and server API behavior.
- Phase 8: UX, screen inventory, design system, accessibility, and SEO.
- Phase 9: Implementation readiness, quality gates, tests, release checklist, and migration/data-operation controls.
- Phase 10: Integration blueprint for frontend/service/API/Firebase/admin-registry boundaries.
- Phase 11: Implementation work breakdown, module tracking, release readiness tracking, and documentation maintenance.

## Source Baseline

Primary sources are `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `AGENTS.md`, `.claude/CLAUDE.md`, `src/pages/admin/README.md`, `app/routes.ts`, `package.json`, `firestore.rules`, `firestore.indexes.json`, and the source folders under `app/` and `src/`.
