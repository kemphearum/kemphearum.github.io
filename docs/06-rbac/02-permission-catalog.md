# Permission Catalog

## Source

`src/registry/permissionRegistry.js` derives modules and actions from registered features.

## Capability Model

Feature descriptors define modules and available actions. Custom role permission documents grant tabs and actions per module.

## Action Families

| Feature Type | Common Actions |
|---|---|
| Content modules | view, create, edit, delete, publish, archive, view history |
| System modules | view, configure, manage, export, view audit logs |
| Simple profile/home/about/resume modules | view, edit, view history |

## Default Permission Pattern

Content features generally grant full content actions to admins and editors, limited create/edit/history actions to authors, and view-only access to viewers. System features generally grant privileged actions to admins and no default editor/author/viewer access.

## Maintenance Rule

Adding a feature that needs admin access must include registry descriptors, UI gating, and Firestore rule review.
