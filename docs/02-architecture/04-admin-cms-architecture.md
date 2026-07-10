# Admin CMS Architecture

## Admin Shell

`src/pages/Admin.jsx` mounts the admin experience and uses `src/pages/admin/components/AdminLayout.jsx` for sidebar, header, and content framing.

## Registry-Driven Configuration

Admin navigation, content types, search, settings, permissions, features, and dashboard widgets derive from `src/registry/*`.

## Shared CRUD

CRUD-heavy tabs use `useAdminCrud.js`, `adminCrudIO.js`, `BulkActionsBar.jsx`, and `DataTable.jsx` to avoid duplicated list, pagination, import, export, mutation, and selection logic.

