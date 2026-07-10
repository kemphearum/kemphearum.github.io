# Repository Governance

## Governance Sources

Use `AGENTS.md`, `.claude/CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `docs/VERSIONING.md` as the governance baseline.

## Change Discipline

Make minimal targeted diffs. Do not refactor unrelated code while documenting or fixing another area. Keep root docs and phase docs synchronized when architectural behavior changes.

## Sensitive Files

Changes to `.env*`, `firebase.json`, `firestore.rules`, `src/firebase.js`, `vite.config.js`, `vercel.json`, and `react-router.config.ts` require explicit review because they affect security, deployment, or runtime behavior.

