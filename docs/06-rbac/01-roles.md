# Roles

## Role Families

Observed roles include anonymous, pending, signed-in staff, editor/writer, admin/administrator, superadmin/owner, and custom roles backed by `rolePermissions`.

## Sources

- `firestore.rules`
- `src/utils/permissions.js`
- `src/registry/permissionRegistry.js`
- `src/services/auth/PermissionService.js`
- User management admin components

## Rule

Any new role behavior must be represented in both client permission logic and Firestore rule enforcement.

