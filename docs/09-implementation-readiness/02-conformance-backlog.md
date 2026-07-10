# Conformance Backlog

| ID | Area | Gap | Recommended Action |
|---|---|---|---|
| CBL-001 | Firestore rules | Rule tests are referenced but not observed | Add `firestore.rules.test.mjs` or update instructions if tests live elsewhere |
| CBL-002 | UX verification | Screenshots and audit reports are placeholders | Run browser checks and save reports/screenshots under `docs/08-ux/` |
| CBL-003 | Architecture decisions | ADR folder has no accepted decisions | Add ADRs for future baseline-changing decisions |
| CBL-004 | Schema | Collection list is source-grounded but not export-verified | Compare docs to production/staging Firestore export |
| CBL-005 | Release checks | Build/lint status is not recorded in this docs-only pass | Run when source changes or before release |

