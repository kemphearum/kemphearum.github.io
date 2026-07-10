# Verification Baseline

## Documentation-Only Verification

- Confirm requested docs tree exists.
- Confirm all files under `docs/` are Markdown.
- Confirm `docs/VERSIONING.md` remains.
- Confirm `git status --short` shows only expected docs changes.

## Source-Change Verification

- Run `npm run lint` after changes touching `src/` or `app/`.
- Run `npm run build` after changes touching routing, SSR, config, deployment, or high-risk UI behavior.
- Verify signed-out public routes and signed-in admin routes where relevant.
- Review Firestore rules and indexes for data access changes.

## Operational Verification

- Validate RBAC scripts before permission changes.
- Validate missing translations before i18n releases.
- Verify database export/backup before import, restore, archive, or wipe operations.

