# Admin Panel — Architecture Notes

Reference for the admin CMS under `src/pages/admin`. Read this before adding or
refactoring an admin tab so new code follows the shared patterns instead of
re-introducing the duplication that `useAdminCrud` was built to remove.

> **Zero-cost constraint.** Everything here must stay deployable on GitHub Free +
> Firebase Spark + Vercel Hobby. No Firebase Storage, new Cloud Functions, Cloud
> Scheduler, Blaze services, background jobs, or paid APIs. Features use Firestore
> documents, client/SSR logic, and `localStorage` only (e.g. images are base64 in
> Firestore; scheduling is computed at read time, not by a cron).

## Layout & shell

- `src/pages/Admin.jsx` — auth gate + shell. Lazy-loads each tab (with chunk
  retry) and routes the active tab through `AdminLayout`. The default landing tab
  is `dashboard`.
- `components/AdminLayout.jsx` — sidebar + header + content frame. Renders the
  page title/subtitle and a breadcrumb (`Dashboard / {section}`) for non-dashboard
  tabs.
- `components/Sidebar.jsx`, `components/Header.jsx` — navigation chrome.
- `adminUtils.js` — `tabLabelKeys` / `tabSubtitleKeys` map each tab to its i18n
  title/subtitle. Add an entry here when you add a tab.

## Dashboard

`dashboard/DashboardTab.jsx` is the landing control center. It is RBAC-aware:
every card/section is gated by `isActionAllowed(ACTIONS.VIEW, module)` and only
renders for roles that can see the underlying module. The overview stat cards
reuse the same react-query keys as the content tabs (`['projects','stats']`,
`['posts','stats']`, `['experience','stats', language]`) so the data is shared
from cache rather than re-fetched. The recent-activity feed is superadmin-only
because `auditLogs` reads are restricted at the Firestore layer.

## Shared CRUD building blocks

Content tabs (blog, projects, experience) used to repeat ~700 lines of identical
list/selection/mutation/import boilerplate. That logic now lives in three shared
pieces:

### `hooks/useAdminCrud.js`

One hook that owns the mechanical CRUD machinery: search + debounce + cursor
pagination, the paginated and stats queries, row selection, optimistic
visibility/featured toggles, bulk mutations, dialog state, and the save/delete
executors. The tab declares *what* to fetch and how to persist; the hook handles
*how*.

```js
const crud = useAdminCrud({
  resourceKey: 'posts',                 // react-query base key
  module: MODULES.BLOG,                 // permissions module
  isActionAllowed, showToast, t,
  fetchPaginated: ({ lastDoc, limit, search, trackRead }) =>
    BlogService.fetchPaginated({ lastDoc, limit, search, searchFields: [...], sortBy: 'createdAt', sortDirection: 'desc', includeTotal: true, trackRead }),
  fetchStats: () => BlogService.fetchStats(),
  statsDefault: { total: 0, published: 0, featured: 0, drafts: 0 },
  // statsParam / statsKeyExtra: pass when stats depend on a value (e.g. language)
  toggleVisibility: { mutationFn: (id, current, trackWrite) => BlogService.toggleVisibility(userRole, id, current, trackWrite), on: t('...published'), off: t('...hidden') },
  toggleFeatured:   { mutationFn: (id, current, trackWrite) => BlogService.toggleFeatured(userRole, id, current, trackWrite), on: t('...featured'), off: t('...unfeatured') },
  bulk: {
    delete:        (ids, trackDelete) => BlogService.batchDeletePosts(userRole, ids, trackDelete),
    setVisibility: (ids, visible, trackWrite) => BlogService.batchUpdatePostsVisibility(userRole, ids, visible, trackWrite),
    setFeatured:   (ids, featured, trackWrite) => BlogService.batchUpdatePostsFeatured(userRole, ids, featured, trackWrite),
    messages: { deleted: (count) => t('...deletedMany', { count }), visibility: (count, visible) => ..., featured: (count, featured) => ... }
  },
  messages: { created: t('...created'), updated: t('...updated'), deleted: t('...deleted') }
});
```

The hook returns `items`, `listResult`, `stats`, `isLoading`, `isFetching`,
`searchQuery`, `handleSearch`, `isSearching`, `pagination`, `selection`,
`selectedIds`, dialog state (`editingItem`/`deletingItem`/`historyItem` + their
setters and `isFormOpen`/`isHistoryOpen`), `ensurePermission(action)`,
`handleToggleVisibility`, `handleToggleFeatured`, the bulk mutations + `bulkPending`,
`formLoading`/`deleteLoading`, `saveItem(fn)` (auto-picks the create vs update
message from `editingItem`), `executeDelete(fn)`, and the activity trackers.

Lighter tabs opt out by omitting config: experience passes no `toggleFeatured`/
`bulk`, so those handlers are inert.

Resource-specific logic (edit transforms, save payloads, import field mapping)
stays in the tab as small callbacks — keep it there; don't push it into the hook.

### `adminCrudIO.js`

Pure import/export helpers shared by the tabs: `parseBoolean`, `readImportFile`,
`parseImportItems`, `downloadJson`, `downloadCsv`, and the generic `runImport`
(returns `{ created, updated, skipped, failed }`; `buildPayload` returns a falsy
value to skip a row).

### `components/BulkActionsBar.jsx`

Declarative selection toolbar. Renders nothing when nothing is selected. Pass a
`count`, a `label`, and an `actions` array of
`{ icon, label, title, onClick, disabled, variant }` (or `{ divider: true }`).

## Adding a new CRUD tab

1. Add a service with `fetchPaginated` / `fetchStats` (+ toggle/batch methods if needed).
2. Add `MODULES.<NAME>` and `MODULE_ACTIONS` entry in `src/utils/permissions.js`.
3. Build the tab with `useAdminCrud` + `BulkActionsBar` + `DataTable`.
4. **Register a descriptor** in `src/registry/contentTypeRegistry.js` (key, module,
   navGroup, labelKey, icon, lazy `load`, `statusCapable`) and add the key to the
   right group in `src/registry/navRegistry.js`. Nav, routing (`Admin.jsx` resolves
   content tabs from the registry), and the page title come for free. Add a search
   entry in `src/registry/searchRegistry.js` to make it searchable.
5. Add Firestore rules (+ `firestore.rules.test.mjs`) and i18n keys.

## Registries

Adding a content type is "register, don't edit many files". The registries:

- `registry/contentTypeRegistry.js` — the source of truth per content type. `Sidebar`
  nav (via `navRegistry`), `Admin.jsx` routing, and page titles all derive from it.
- `registry/navRegistry.js` — ordered sidebar layout + special (non-content) tabs;
  `getNavigableKeys()` lists every navigable tab for the command palette.
- `registry/searchRegistry.js` — search providers derived from the content registry;
  each declares its service, searchable `text`, and `title`/`subtitle` builders.
- `registry/settingsRegistry.js` — declarative settings domain sections (SEO, social,
  feature flags); `SettingsTab` renders them with uniform props. (The legacy identity/
  typography/visuals/sync sub-tabs keep bespoke wiring.)
- `registry/dashboardWidgetRegistry.js` — dashboard widgets; each is self-contained
  (own queries), `canView(ctx)`-gated, and `order`-sorted, so the dashboard is composed
  by registration and is ready for drag-and-drop ordering.

## Command palette (Cmd/Ctrl+K)

`pages/admin/search/CommandPalette.jsx` is a keyboard-first launcher mounted in the
`Admin` shell via `hooks/useCommandPalette.js` (global Cmd/Ctrl+K). It offers
navigation (every viewable tab), create actions (content types the role can create),
and fuzzy content search across all registered search providers — grouped by type,
↑/↓ to move, Enter to open, Esc to close. To minimize Firestore reads, search queries
are debounced (250ms), providers are lazy-loaded only when typing, and results are cached
under `['palette', key]` (5 min). Recent picks persist in `localStorage`.
Fuzzy ranking lives in `utils/fuzzy.js`. RBAC-gated: results and
navigation only show tabs/modules the role may view.

## Notifications

`context/NotificationContext.jsx` is the single notification service — every toast
routes through it (`Admin.showToast` calls `record()`), so there is one history with
unread tracking, persisted to `localStorage` (last 20). The header bell + panel
(`components/NotificationCenter.jsx`) reads it via `useNotifications()` from
`context/NotificationContextValue.js`. `AdminToast` stays the transient display.

## Revision restore

`BaseService.restoreVersion(id, historyEntryId, trackWrite)` re-applies a history
snapshot as a normal update — non-destructive (it becomes a new history entry and is
audit-logged). `HistoryModal` exposes it (perm-gated via `canRestore`) with a
preview-before-restore panel; the existing timeline + diff are untouched.

## Feature flags

`hooks/useFeatureFlag.js` reads `featureFlags` from the shared `['settings','global']`
cache (opt-out: defaults to enabled). Edit them in Settings → Feature flags.

## Scheduled publishing (effective status)

`domain/shared/contentStatus.js` is the single source of truth. Content is never
flipped by a background job (zero-cost). Instead each record stores `status`
(`draft` / `scheduled` / `published` / `archived`) plus `publishAt` / `expireAt` /
`publishedAt` / `archivedAt`, and the **effective** status is computed at read time:
a scheduled item becomes published once `publishAt` passes; anything past `expireAt`
becomes archived. `normalizeStatusFields` keeps the legacy `visible` flag in sync so
existing Firestore queries still return the right candidate set, then
`filterPublished` does the fine-grained gating on public pages
(`sections/FeaturedBlogs|FeaturedProjects|Projects`, `pages/Blog.jsx`). Admin tables
show the effective status (and the stored one when they differ) via
`components/StatusBadge.jsx`. Status-capable types are flagged `statusCapable` in the
content registry. A future scheduler could flip stored status without changing any UI.

## Tables, forms, accessibility

- `shared/components/ui/data-table/DataTable.jsx` — generic table: sorting
  (keyboard-accessible header buttons with `aria-sort`), cursor/numbered
  pagination, selection (labelled checkboxes), CSV export, mobile cards,
  skeletons, empty states. All UI strings are i18n via `admin.common.table.*`.
- `components/Form.jsx` — react-hook-form wrapper. It calls
  `useUnsavedChangesWarning(isDirty)` so any form guards against losing unsaved
  edits on refresh/tab close.

## Database Management Center

The `DatabaseTab` (`src/pages/admin/database/DatabaseTab.jsx`) acts as a comprehensive database management utility designed entirely around the zero-cost architecture constraint:
- **No Cloud Functions/Firebase Storage:** Features like `DatabaseAssetAnalytics` and `DatabaseHealthCheck` perform their scans client-side. They download the required collections, throttle their loops to prevent main-thread freezing, and process metadata locally. While this would not scale for a massive enterprise dataset without a backend, it is highly efficient for a portfolio CMS.
- **Batch Operations:** All CSV imports and restores use `writeBatch(db)` chunked to 450 operations per batch to safely operate within Firestore's 500-operation limit.
- **Data Integrity & Audit:** All destructive or mutative actions (Import, Export, Restore, Archive) are strictly logged to the `auditLogs` collection via `AuditLogService`.
