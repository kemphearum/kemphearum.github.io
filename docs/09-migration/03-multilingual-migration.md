# Multilingual Migration

## Purpose

The portfolio supports English and Khmer content. Migration work must preserve localized field structure and avoid overwriting one language while updating another.

## Sources

- `src/i18n/en.json`
- `src/i18n/km.json`
- `src/services/MultilingualMigrationService.js`
- `scripts/update_translations.cjs`
- `scripts/checkMissingTranslations.mjs`
- domain normalizers under `src/domain/*`

## Rules

- Keep UI translation keys synchronized across English and Khmer.
- Preserve localized Firestore field shape for CMS-backed content.
- Run missing-translation checks after translation key changes.
- Treat date, period, and professional terminology as content-quality concerns, not only technical migration concerns.

