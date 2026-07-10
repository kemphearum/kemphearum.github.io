# Firestore Rules RBAC

## Enforcement Boundary

`firestore.rules` is authoritative for Firestore access. Admin UI checks are advisory and must not be relied on alone.

## Rule Helpers

Rules define helpers for signed-in users, role resolution, superadmin/admin/editor checks, custom role permission docs, module writes, message access, and payload validation.

## Rule

When role behavior changes, update rules, utilities, admin docs, and future rule tests together.

