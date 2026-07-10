# Portfolio Implementation Roadmap

**Date:** 2026-07-10  
**Status:** Documentation baseline roadmap  
**Scope:** Future implementation sequencing for the portfolio application

## Entry Rule

Implementation work should begin from the current repository baseline and must preserve `AGENTS.md`, `.claude/CLAUDE.md`, `ARCHITECTURE.md`, and the phase documents created under `docs/`.

## Recommended Milestone Sequence

| Milestone | Name | Primary Output | Required Inputs |
|---|---|---|---|
| M0 | Baseline documentation | Current docs tree and traceability matrix | `docs/_program/*` |
| M1 | Production validation | Verified Vercel, Firebase, routes, auth, and hydration | `ROADMAP.md`, Phase 9 gates |
| M2 | Enterprise SEO | Metadata, sitemap, RSS, robots, structured data, and canonical coverage | Phase 8 SEO docs |
| M3 | Performance optimization | Bundle, image, font, Firestore read, and caching improvements | Phase 0 performance baseline |
| M4 | Security hardening | Rules audit, headers, secret handling, dependency audit, and API validation | Phase 0 security, Phase 6 RBAC |
| M5 | Portfolio content completion | Recruiter-friendly public content and CMS completeness | Phase 1 content models, Phase 8 UX |
| M6 | Admin CMS hardening | Registry, CRUD, import/export, audit, and database management improvements | Phase 5 modules, Phase 6 RBAC |
| M7 | Analytics and reporting | Free-tier compatible analytics dashboards and exports | Phase 5 modules, Phase 7 API |
| M8 | CI/CD and release readiness | Lint/build/security checks and deployment checklist | Phase 9 quality gates |

## Workstream Rules

- Cite relevant phase docs and source files before editing architecture-sensitive areas.
- Keep public content CMS-backed where content models exist.
- Keep Firestore rules, client permissions, and admin registry descriptors aligned.
- Do not introduce paid Firebase or external background-job services.
- Update phase docs when routes, modules, rules, services, or UX behavior materially change.

