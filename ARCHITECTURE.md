# Architecture Guide

> The single source of truth for project structure, naming, and patterns.

---

## 1. Component Placement Rules

| Condition | Location |
| --------- | -------- |
| Used by **1 component only** | Colocate inside feature folder (e.g., `admin/blog/components/`) |
| Used by **2+ admin tabs** | Move to `admin/components/` |
| Used **across the app** (admin + public) | Move to `shared/components/` |

**Duplication is never allowed.** If you copy-paste a component, you must extract it.

---

## 2. Folder Structure

```
src/
├── components/         # Root-level global components (e.g., SiteStatusOverlay)
├── context/            # React Context providers
├── domain/             # Data normalization and pure logic (e.g., content models)
├── hooks/              # Custom React hooks
├── i18n/               # Localization files (en.json, km.json)
├── pages/
│   └── admin/
│       ├── blog/
│       │   ├── BlogTab.jsx
│       │   └── components/   # Used ONLY by BlogTab
│       ├── components/       # Shared across 2+ admin tabs
│       └── ...
├── registry/           # Registry-driven admin config (nav, search, content types)
├── sections/           # Page sections (Hero, About, Footer) — NOT reusable widgets
├── server/             # Backend-only logic (contact, auth-log, geo, db-sync)
├── services/           # Firestore/API access and business logic
├── shared/components/  # App-wide reusable UI (DataTable, Dialog, FormField)
│   ├── dialog/
│   ├── form/
│   └── ui/
├── styles/
│   ├── global.scss
│   ├── variables.scss
│   └── components/     # Global UI class partials (_admin-ui.scss)
├── utils/              # Pure utility functions (no side effects)
└── assets/             # Static images, icons
```

---

## 3. CSS Naming & Styling Rules

### Naming Convention

| Prefix | Scope | Example |
| ------ | ----- | ------- |
| `.ui-*` | Global reusable UI elements | `.ui-btn`, `.ui-badge`, `.ui-spinner` |
| `.admin-*` | Admin-specific layouts & containers | `.admin-page-header`, `.admin-sidebar` |

These two systems **must not overlap**. A class is either `.ui-*` (app-wide) or `.admin-*` (admin-only).

### When to Use What

| Layer | Approach | File |
| ----- | -------- | ---- |
| Shared UI components | Global `.ui-*` classes | `_admin-ui.scss` partials |
| Unique tab layouts | CSS Modules | `SettingsTab.module.scss` |
| Public site sections | CSS Modules | `Hero.module.scss` |

### ❌ Do NOT

- Use inline styles
- Mix global classes and CSS Modules for the same element
- Duplicate styles that already exist in `_admin-ui.scss`
- Create a new `.module.scss` for standard admin table/form layouts

---

## 4. Architecture & Data Flow

```
Component → Hook → Service/Domain → Firebase
```

| Layer | Responsibility |
| ----- | -------------- |
| **Page / Section** | Route-level composition, presentation (no raw queries) |
| **Component** | Renders UI, calls hooks, dispatches user actions |
| **Hook** | Manages state, side effects, and loading/error states |
| **Domain** | Data normalization, pure logic, validation (e.g., `experienceDomain.js`) |
| **Service** | Contains ALL Firestore/API access (`DatabaseService`, `*Service`) |
| **Server** | Backend-only logic (contact, auth-log, geo, db-sync) |

### ❌ Do NOT

- Call Firebase directly from a component
- Put business logic inside a component
- Import `firebase/firestore` in any file except `services/`
- Collapse layers together (e.g., placing raw queries in presentational components)

---

## 4.1 Admin Panel Architecture

The admin panel is **registry-driven** and uses shared CRUD machinery:
- **Registry (`src/registry/`)**: Define content types, navigation, search, and dashboard widgets by registering descriptors, rather than editing multiple UI files.
- **Shared CRUD**: Admin tabs (blog, projects, experience, skills) share list/selection/mutation logic via `src/pages/admin/hooks/useAdminCrud.js`, `adminCrudIO.js`, and `BulkActionsBar.jsx`.
- **Rule**: Build new admin tabs on these hooks rather than duplicating tab logic.

---

## 5. Service Patterns

All services extend `BaseService` and are exported as singletons.

### Return Contract

**New code** — use `BaseService.safe()`:
```javascript
const { data, error } = await BaseService.safe(() => ProjectService.getAll());
if (error) return showToast(error, 'error');
```

**Legacy code** — `try/catch` is allowed but should be migrated over time:
```javascript
try {
  const projects = await ProjectService.getAll();
} catch (err) {
  showToast(err.message, 'error');
}
```

### JSDoc Types

Domain models are defined as `@typedef` in `BaseService.js`:
`Project`, `BlogPost`, `Experience`, `User`, `Message`, `ServiceResult`, `PaginatedResult`

---

## 6. Pagination Strategy

| Strategy | When to Use | Examples |
| -------- | ----------- | -------- |
| **Cursor-based** (`useCursorPagination`) | Large or growing datasets | Audit Logs, Users, Messages |
| **Client-side** | Small, bounded datasets | Blog tags, Project tech filters |

### ❌ Do NOT

- Mix both strategies in a single component
- Implement offset-based pagination (use cursor-based instead)

---

## 7. Hook Rules

| Rule | Detail |
| ---- | ------ |
| **Naming** | Always `useX` (e.g., `useAsyncAction`, `useCursorPagination`) |
| **Return shape** | Must be predictable — object `{ state, actions }` or single value |
| **Side effects** | Contained inside hooks only, never in components directly |
| **No raw Firebase** | Hooks call services, never Firebase directly |

### Standard Return Shapes

| Hook | Returns |
| ---- | ------- |
| `useAsyncAction` | `{ loading, execute }` |
| `useCursorPagination` | `{ limit, cursor, page, hasMore, fetchNext, fetchPrevious, reset, ... }` |
| `useDebounce` | `debouncedValue` |

---

## 8. Import Conventions

Absolute imports via `@/` alias (configured in `vite.config.js` + `jsconfig.json`):

```javascript
import ProjectService from '@/services/ProjectService';
import Hero from '@/sections/Hero';
import { DataTable } from '@/shared/components/ui/data-table/DataTable';
```

Use relative imports only for same-directory or direct-parent references.

---

## 9. Quick Reference

### Where do I put a new...

| Thing | Location |
| ----- | -------- |
| Admin tab component | `pages/admin/<tab>/components/` |
| Reusable admin widget | `pages/admin/components/` |
| App-wide UI component | `shared/components/ui/` |
| Page section (Home) | `sections/` |
| Data normalization / logic | `domain/` |
| Backend-only logic | `server/` |
| Admin config (nav, search) | `registry/` |
| Firebase logic | `services/<Domain>Service.js` |
| React state logic | `hooks/use<Name>.js` |
| Pure helper function | `utils/<name>.js` |
| Global admin styles | `styles/components/_admin-ui.scss` |
| Tab-specific layout | `pages/admin/<tab>/<Tab>.module.scss` |

### How do I call a service?

```javascript
// Preferred (new code)
const { data, error } = await BaseService.safe(() =>
  ProjectService.saveProject(userRole, formData, imageUrl, trackWrite)
);

// Legacy (existing code — migrate when touching)
try {
  await ProjectService.saveProject(userRole, formData, imageUrl, trackWrite);
} catch (err) { showToast(err.message, 'error'); }
```

---

## 10. Prohibited Patterns

| ❌ Never Do | ✅ Instead |
| ---------- | --------- |
| Inline styles (`style={{}}`) | Use CSS classes |
| Direct Firebase calls in components | Call through `services/` |
| Duplicated components across tabs | Extract to `admin/components/` or `shared/` |
| Mix `.module.scss` + global classes on same element | Pick one approach per element |
| Raw `console.log` in production code | Use structured error handling |
| Offset-based pagination | Use cursor-based via `useCursorPagination` |
| Add paid APIs, Cloud Functions, Storage | Follow **Zero-cost constraint** (GitHub Free, Firebase Spark, Vercel Hobby) |
| Hardcode copy in CMS-backed sections | Use content models and `useTranslation`/`getLocalizedField` |
