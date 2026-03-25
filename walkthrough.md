# Master Database Workflow

## 1) Advanced Seeding (`seed-all.cjs`)

Use one of these modes:

```bash
# Standard reset + reseed
node scripts/seed-all.cjs

# Hard reset (also wipes users + rolePermissions)
node scripts/seed-all.cjs --hard-reset

# Full reset (wipes all top-level collections before reseed)
node scripts/seed-all.cjs --full-reset
```

PowerShell env mode examples:

```powershell
$env:HARD_RESET=1; node scripts/seed-all.cjs
$env:FULL_RESET=1; node scripts/seed-all.cjs
```

## 2) Clean Settings (`seed-settings.cjs`)

Settings seeding uses full replacement:

- `merge: false` for `settings/global`
- `merge: false` for `settings/metadata`

This prevents stale keys from older settings payloads.

## 3) Optimized Indexes (`firestore.indexes.json`)

After updating index definitions:

```bash
firebase deploy --only firestore:indexes
```

Notes:

- Indexes are independent from seed resets.
- Seed runs do not remove indexes.

## 4) Recommended End-to-End Order

1. Update/verify `firestore.indexes.json`
2. Deploy indexes
3. Run seed mode needed (`standard`, `--hard-reset`, or `--full-reset`)
4. Validate admin database health dashboard
