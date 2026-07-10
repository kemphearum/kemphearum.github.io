# Documentation Maintenance

## Update Triggers

Update phase docs when future changes affect:

- Routes or API contracts.
- Firestore collections, indexes, or rules.
- Admin registries or permissions.
- Domain normalizers or content status lifecycle.
- Public UX, accessibility, or SEO behavior.
- Deployment, config, or environment behavior.
- Database migration, seed, sync, import, export, or restore flows.

## Maintenance Rule

Do not let root docs and phase docs diverge. When `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, or `src/pages/admin/README.md` changes, review the phase docs for necessary updates.

