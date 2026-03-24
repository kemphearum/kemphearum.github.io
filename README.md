# KEM PHEARUM - Portfolio

A modern portfolio and admin platform built with React, React Router v7, Firebase, and SCSS.

Live sites:
- GitHub Pages: https://kemphearum.github.io/
- Vercel: https://phearum-info.vercel.app/
- Firebase (Primary): https://phearum-info.web.app/
- Firebase (Mirror): https://kem-phearum.web.app/

## Core Features

### Public Site
- Hero, About, Experience, Projects, Blog, Contact, Footer
- Light and dark theme with persistent preference
- Blog markdown rendering with sanitization and code highlighting
- SEO-friendly SSG routing with clean URLs

### Admin Dashboard
- Firebase Auth (email/password)
- CRUD for Projects, Experience, and Blog
- Settings module (identity, typography, visuals, sync)
- User management and role-based access control
- Audit logs, analytics, and message management
- Database maintenance tools (backup, restore, archive)

## Admin Database Maintenance

The Database tab includes three operational tools:

### 1) Full Backup
- Exports a JSON snapshot of tracked collections:
  - `posts`, `projects`, `experience`, `content`, `messages`, `auditLogs`, `users`, `rolePermissions`, `settings`, `visits`, `dailyUsage`
- Also exports important subcollections:
  - document `history` for selected admin-managed collections
  - `dailyUsage/{date}/logs`
- Downloaded file format includes metadata (`format`, `exportDate`, `collections`).

### 2) Restore From Backup
- Accepts JSON backup files and restores to Firestore document-by-document.
- Supports both newer backup envelope format (`collections`) and legacy object-only backups.
- Restores Firestore timestamps from serialized objects (including `{ seconds, nanoseconds }` forms).
- Progress reflects processed records across the entire restore job.
- Existing documents with the same IDs are overwritten.

### 3) Archive Old Records
- Archives and removes old operational data:
  - `messages`, `auditLogs`, `visits`
  - `dailyUsage` day documents older than cutoff, including `dailyUsage/{date}/logs`
- Produces a downloadable archive JSON before finishing.
- Uses chunked Firestore batch deletes for reliability on large archives (avoids batch operation limits).
- Requires a positive day-range value.

## Multilingual System (English + Khmer)

This project now supports bilingual UI and content with **ISO language codes only**:
- English: `en`
- Khmer: `km`

Important:
- Do not use `kh` for language. `kh`/`KH` refers to country code (Cambodia), not language.

### 1) Static UI Translations
- Files:
  - `src/i18n/en.json`
  - `src/i18n/km.json`
- Hook:
  - `src/hooks/useTranslation.js`
- Provider:
  - `src/context/LanguageContext.jsx`

Behavior:
- `t('path.to.key')` translation helper
- Fallback to English when key is missing
- Language persisted in `localStorage` using key: `portfolio.language`

### 2) Dynamic Firestore Content (Localized Fields)

Localized content is stored in a **single document** per entity.

Correct shape:
```json
{
  "title": {
    "en": "My Project",
    "km": "..."
  }
}
```

Rules:
- Store both languages in the same document
- Do not split collections per language
- Do not use flat fields like `title_en`

Localization utilities:
- `src/utils/localization.js`
  - `getLocalizedField(field, lang)`
  - `toLocalizedField(value)`
  - `buildLocalizedFieldFromInput(data, field)`

### 3) Admin Language Support

- Global switcher component:
  - `src/shared/components/LanguageSwitcher.jsx`
- Admin shell localized (header, sidebar, login, tab titles)
- Role permissions panel localized

### 4) Data Migration for Existing Documents

Migration service:
- `src/services/MultilingualMigrationService.js`

What it does:
- Converts legacy string fields into `{ en, km }`
- Keeps English as default
- Initializes Khmer as empty when missing

## Khmer Font Support

Khmer rendering is supported with language-aware font fallbacks.

Configured in:
- `src/styles/global.scss`

Includes:
- Google font import for `Noto Sans Khmer`
- Khmer-first font variables when `html[lang="km"]`
- Admin font override updated to include Khmer-safe fallbacks

If Khmer text appears as `?`:
1. Ensure translation files are saved in UTF-8
2. Hard refresh browser cache (`Ctrl+F5`)
3. Confirm app language is set to `km`

## Responsive Admin UI (EN + KM)

- Admin dialogs and form controls are tuned for small screens (mobile-first behavior for action buttons, field wrapping, and footer stacks).
- Long Khmer and English labels are wrapped safely to prevent overflow in cards, dialogs, and database controls.
- Database action cards (Backup/Restore/Archive) are optimized for touch-width layouts.

## Architecture

```text
src/
  sections/              public UI sections
  shared/components/     reusable UI components
  pages/admin/           modular admin tabs and modules
  services/              Firestore service layer
  hooks/                 reusable hooks
  i18n/                  translation dictionaries
  context/               app-wide providers
  utils/                 shared utilities
```

## Tech Stack

- React 19
- React Router v7
- Vite 7
- Firebase (Firestore + Auth)
- TanStack Query v5
- SCSS + CSS Modules
- Vitest

## Getting Started

### Install
```bash
git clone https://github.com/kemphearum/portfolio.git
cd portfolio
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Test
```bash
npm test
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build (client + server output)
- `npm run preview` - preview production build
- `npm run lint` - lint project
- `npm test` - run unit tests

## License

MIT License

Built by KEM PHEARUM.
