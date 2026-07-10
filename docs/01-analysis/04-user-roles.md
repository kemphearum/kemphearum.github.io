# User Roles

## Observed Role Model

Firestore rules and services reference anonymous users, signed-in users, staff, editors/writers, admins/administrators, superadmins, owners, pending users, and custom roles resolved through `rolePermissions`.

## Role Sources

- `firestore.rules`
- `src/registry/permissionRegistry.js`
- `src/utils/permissions.js`
- `src/services/auth/PermissionService.js`
- User management admin components

## Rule

Role names and custom role behavior must remain synchronized between client permission utilities, registry descriptors, and Firestore rules.

