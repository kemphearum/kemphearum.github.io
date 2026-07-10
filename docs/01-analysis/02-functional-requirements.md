# Functional Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Render CMS-backed public portfolio sections. | `src/sections/*`, `src/services/*` |
| FR-002 | Render project and blog index/detail routes by slug. | `app/routes.ts`, `ProjectService`, `BlogService` |
| FR-003 | Provide an authenticated admin CMS at `/admin`. | `app/routes.ts`, `src/pages/Admin.jsx` |
| FR-004 | Support CRUD and import/export for registered content types where implemented. | Admin README, `useAdminCrud.js`, `adminCrudIO.js` |
| FR-005 | Enforce admin permissions through UI gates and Firestore rules. | `permissionRegistry.js`, `firestore.rules` |
| FR-006 | Record contact messages through server API validation. | `/api/contact`, `contactSubmission.js` |
| FR-007 | Produce sitemap, RSS, robots, and route metadata for SEO. | `app/routes/*xml.jsx`, `robots[.]txt.jsx` |

