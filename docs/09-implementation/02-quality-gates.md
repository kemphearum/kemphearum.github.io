# Quality Gates

## Standard Gates

- Run `npm run lint` after source changes under `src/` or `app/`.
- Run build checks for deployment-sensitive changes.
- Verify responsive behavior for UI changes.
- Review accessibility and SEO for public route changes.
- Review security impact for auth, Firestore, server API, and environment changes.

## Documentation Gate

Documentation-only changes should verify file tree, Markdown files, preserved `docs/VERSIONING.md`, and no unexpected app/config changes.

