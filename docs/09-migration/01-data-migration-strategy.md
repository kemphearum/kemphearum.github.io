# Data Migration Strategy

## Scope

Migration for this portfolio means moving, seeding, validating, importing, exporting, restoring, or normalizing Firestore-backed portfolio CMS data. It does not mean introducing a separate database platform.

## Current Migration Surfaces

- `scripts/seed-sample-data.mjs`: initializes sample/default Firestore data.
- `scripts/update_translations.cjs` and `scripts/checkMissingTranslations.mjs`: maintain i18n data completeness.
- `scripts/validateRbac.mjs` and `scripts/testPermissionEnforcement.mjs`: validate permission model behavior.
- `scripts/wipe-data.mjs`: destructive data reset utility requiring explicit care.
- `src/services/MultilingualMigrationService.js`: migration support for multilingual content.
- `src/services/DatabaseService.js`: admin-facing export, restore, archive, health, and data integrity operations.

## Strategy

Use Firestore documents, JSON/CSV import/export, batch writes, validation scripts, and admin database utilities. Keep migrations compatible with Firebase Spark and avoid Cloud Functions, Scheduler, Storage, or paid services.

## Controls

- Treat destructive scripts as privileged operational tools.
- Use `MAX_BATCH_OPERATIONS = 450` in database operations to stay below Firestore batch limits.
- Preserve audit logging for admin-initiated import, restore, archive, and sync operations.

