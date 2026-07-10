# Seed and Import Runbook

## Seed Data

Use the package script when intentionally seeding a Firebase project:

```powershell
npm run seed -- --project kem-phearum
```

Do not run seed commands as part of documentation-only changes.

## Admin Import/Export

The admin CMS provides import/export behavior through shared CRUD helpers and database management components. Content tabs use `adminCrudIO.js` for JSON/CSV operations where implemented.

## Validation Before Import

- Confirm target project ID and environment.
- Confirm user has the correct admin/superadmin role.
- Confirm Firestore rules permit the intended writes.
- Confirm backup/export exists before destructive restore or wipe work.
- Confirm localized fields include required English/Khmer structures where relevant.

## Rollback

Use exported JSON snapshots or restore workflows where available. Record the operation in audit logs and document any manual recovery steps.

