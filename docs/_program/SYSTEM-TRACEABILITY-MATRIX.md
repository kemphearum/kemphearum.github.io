# System Traceability Matrix

| ID | Capability | Source | Module | Data | Route/API | Permission | UX |
|---|---|---|---|---|---|---|---|
| CAP-001 | Public home portfolio | `src/pages/Home.jsx`, `src/sections/*` | Public portfolio | Firestore content via services | `/` | Public read rules | Home sections |
| CAP-002 | Projects listing/detail | `app/routes.ts`, `ProjectService`, project domain | Projects | `projects` collection | `/projects`, `/projects/:slug` | Public read, admin write | Projects pages and cards |
| CAP-003 | Blog listing/detail | `app/routes.ts`, `BlogService`, blog domain | Blog | `posts` collection | `/blog`, `/blog/:slug`, `rss.xml` | Public read, admin/editor write | Blog pages and renderer |
| CAP-004 | Admin CMS | `src/pages/Admin.jsx`, admin README | Admin shell | Content collections | `/admin` | Role and permission gated | Admin layout and tabs |
| CAP-005 | Contact submission | `routes/api.contact.jsx`, `src/server/contactSubmission.js` | Contact | `messages` collection | `/api/contact` | Server validated write, admin read | Contact section and messages tab |
| CAP-006 | Geo lookup | `routes/api.geo.jsx`, `src/server/geoLookup.js` | Analytics | visit metadata | `/api/geo` | Server proxy | Analytics panels |
| CAP-007 | Auth logging | `routes/api.authLog.jsx`, `src/server/authAudit.js` | IAM/Audit | `auditLogs`, user sessions | `/api/auth-log` | Server logged | User management and audit tabs |
| CAP-008 | Database sync | `routes/api.dbSync.jsx`, `src/server/databaseSync.js` | Database admin | Firestore export/import data | `/api/db-sync` | Admin controlled | Database tab |
| CAP-009 | SEO feeds | `routes/sitemap[.]xml.jsx`, `routes/rss[.]xml.jsx` | SEO | public content | `/sitemap.xml`, `/rss.xml` | Public | Search engine and feed consumers |
| CAP-010 | Data migration and database operations | `scripts/*`, `DatabaseService`, database admin components | Migration/database admin | Firestore collections and JSON/CSV exports | Admin database UI and `/api/db-sync` | Admin/superadmin gated | Database tab |
| CAP-011 | Admin registry integration | `src/registry/*`, admin README | Admin platform | Feature and permission descriptors | `/admin` | Role and custom permission gated | Sidebar, command palette, dashboard, settings |
| CAP-012 | Multilingual portfolio content | `src/i18n/*`, localization utilities, localized domain fields | i18n | Localized UI dictionaries and Firestore localized fields | Public and admin routes | Public/admin by context | Language switcher and localized screens |
| CAP-013 | User and permission management | `usersFeature`, `UserService`, `PermissionService`, Firestore rules | IAM/RBAC | `users`, `rolePermissions`, sessions | `/admin` | Admin/superadmin gated | User management tab |
| CAP-014 | Analytics and audit | `AnalyticsService`, `AuditLogService`, analytics/audit tabs | Analytics/audit | `visits`, `auditLogs`, logs | `/api/analytics`, `/api/auth-log`, `/admin` | Admin and custom role gated | Analytics and audit tabs |
