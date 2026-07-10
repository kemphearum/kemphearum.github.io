# Admin Registry Integration

## Registry Flow

Feature descriptors feed content types, navigation, permissions, search, settings, and dashboard widgets.

## Integration Steps for New Admin Capability

1. Add or update feature descriptor.
2. Connect content type registry if CMS-backed.
3. Add navigation group/order through nav registry.
4. Add permissions through the feature/permission model.
5. Add search provider if searchable.
6. Add settings/dashboard descriptors if relevant.
7. Add Firestore rules and tests for data access.

## Rule

Prefer descriptor registration over editing many admin files manually.

