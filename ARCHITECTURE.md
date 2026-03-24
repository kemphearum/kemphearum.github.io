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
├── sections/           # Page sections (Hero, About, Footer) — NOT reusable widgets
├── shared/components/  # App-wide reusable UI (DataTable, Dialog, FormField)
│   ├── dialog/
│   ├── form/
│   └── ui/
├── pages/
│   └── admin/
│       ├── blog/
│       │   ├── BlogTab.jsx
│       │   └── components/   # Used ONLY by BlogTab
│       ├── components/       # Shared across 2+ admin tabs
│       └── ...
├── services/           # Firebase business logic (one per domain)
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── utils/              # Pure utility functions (no side effects)
├── styles/
│   ├── global.scss
│   ├── variables.scss
│   └── components/     # Global UI class partials (_admin-ui.scss)
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

## 4. Data Flow

```
Component → Hook → Service → Firebase
```

| Layer | Responsibility |
| ----- | -------------- |
| **Component** | Renders UI, calls hooks, dispatches user actions |
| **Hook** | Manages state, side effects, and loading/error states |
| **Service** | Contains ALL Firebase/API logic |
| **Firebase** | Data storage (never accessed directly by components) |

### ❌ Do NOT

- Call Firebase directly from a component
- Put business logic inside a component
- Import `firebase/firestore` in any file except `services/`

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
