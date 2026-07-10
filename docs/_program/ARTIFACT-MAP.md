# Artifact Map

## Existing Root Artifacts

- `README.md`: public overview, features, install, deployment, security, performance, and roadmap summary.
- `ARCHITECTURE.md`: folder placement, styling, data-flow, service patterns, hooks, imports, and prohibited patterns.
- `ROADMAP.md`: production validation, SEO, performance, security, content, UX, analytics, CI/CD, and documentation roadmap.
- `SECURITY.md`: vulnerability reporting and security posture.
- `CONTRIBUTING.md`: contribution guidance.
- `docs/VERSIONING.md`: versioning documentation.

## New Phase Artifacts

The phase folders under `docs/00-foundation` through `docs/11-implementation` convert existing repo knowledge into a structured design and readiness baseline.

## Extended Reference-Style Artifacts

- `docs/09-migration/`: Firestore seed, import/export, multilingual migration, and database admin operations.
- `docs/09-implementation-readiness/`: readiness assessment, conformance backlog, and verification baseline.
- `docs/10-integration-blueprint/`: frontend-service, API, Firebase, admin registry, and database sync integration contracts.
- `docs/11-implementation/`: work breakdown, module tracker, release readiness tracker, and documentation maintenance rules.

## Mapping Rule

Do not duplicate full root-doc content when a cross-reference is enough. Phase documents should summarize the relevant design decision and point back to the authoritative root or source file.
