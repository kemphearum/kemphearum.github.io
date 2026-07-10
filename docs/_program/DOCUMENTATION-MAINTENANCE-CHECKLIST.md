# Documentation Maintenance Checklist

Use this checklist when future implementation changes touch project architecture, behavior, data, security, UX, or deployment.

## Before Editing

- Read `AGENTS.md` and `.claude/CLAUDE.md`.
- Identify affected source files and affected phase docs.
- Check `OPEN-DECISIONS.md` for related unresolved decisions.

## During Editing

- Keep app source changes minimal and targeted.
- Update documentation in the same change when contracts or behavior move.
- Preserve the zero-cost constraint unless an explicit architecture decision approves otherwise.

## Required Documentation Updates

| Change Type | Docs to Review |
|---|---|
| New route or route behavior | `07-api/02-route-catalog.md`, `08-ux/02-screen-inventory.md`, traceability matrix |
| New API route | `07-api/`, `10-integration-blueprint/02-api-integration-contracts.md`, security baseline |
| New content type | `01-analysis/05-content-models.md`, `03-domain-model/`, `04-database/`, `05-modules/`, `06-rbac/`, `08-ux/` |
| Firestore collection/index/rules change | `04-database/`, `06-rbac/`, readiness gates |
| Admin registry change | `05-modules/05-registry-system.md`, `10-integration-blueprint/04-admin-registry-integration.md` |
| Permission model change | `06-rbac/`, `04-database/04-security-rules-mapping.md`, traceability matrix |
| Public UX or SEO change | `08-ux/`, `00-foundation/10-performance-seo-accessibility-baseline.md` |
| Migration/import/export change | `09-migration/`, release checklist |
| Deployment/config change | `00-foundation/07-environment-strategy.md`, `00-foundation/08-configuration-management.md`, `02-architecture/06-deployment-architecture.md` |

## Before Completion

- Run `npm run lint` if `src/` or `app/` changed.
- Run `npm run build` if routing, SSR, deployment, or high-risk UI behavior changed.
- Confirm `docs/VERSIONING.md` still exists.
- Run `git status --short` and confirm changed files match the task.

