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
- Fully statically generated (SSG) for high performance and zero-cost free-tier hosting
- Auto-generated `sitemap.xml` and `rss.xml` for SEO

### Admin Dashboard
- Firebase Auth (email/password)
- CRUD for Projects, Experience, and Blog
- Settings module (identity, typography, visuals, sync)
- User management and role-based access control
- Audit logs, analytics, and message management
- Database maintenance tools (backup, restore, archive)

### Keyboard Shortcuts
- **Global Navigation**
  - `Cmd+K` / `Ctrl+K`: Open the Command Palette to search or navigate anywhere.
  - `Arrow Up` / `Arrow Down`: Navigate through items in the Command Palette.
  - `Enter`: Execute the selected command in the palette.
  - `Esc`: Close the Command Palette, dialogs, or dropdown menus.
- **Markdown Editor (Blog, Projects, etc.)**
  - `Cmd+B` / `Ctrl+B`: Bold selected text.
  - `Cmd+I` / `Ctrl+I`: Italicize selected text.
  - `Cmd+K` / `Ctrl+K`: Insert a markdown link.
  - `Tab`: Inserts 2 spaces for indentation.
- **System Actions (Hidden)**
  - `Alt+Shift+A` (or `Ctrl+Shift+L`): Quickly navigate from the public site to the Admin login/dashboard.

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

## Mobile Navbar and Slide Menu Improvements

- Mobile top controls stay visible and clickable when the slide menu is open.
- Slide menu opens below the fixed top navbar and keeps stable positioning during page scroll.
- Mobile navbar and slide menu now follow desktop top-bar background tokens for theme consistency.
- Slide menu opacity is increased in light mode for better contrast and readability.
- Shadow bleed from the off-canvas menu edge is removed.

## Architecture

```text
app/
  routes/                React Router routes, incl. serverless API routes:
                           api.contact.jsx  -> POST /api/contact
                           api.geo.jsx       -> GET  /api/geo
                           api.authLog.jsx   -> POST /api/auth-log
                           api.dbSync.jsx    -> POST /api/db-sync
  routes.ts              route table
src/
  sections/              public UI sections
  shared/components/     reusable UI components
  pages/admin/           modular admin tabs and modules
  services/              Firestore service layer (client)
  server/                server-only logic for the API routes (Admin SDK)
  hooks/                 reusable hooks
  i18n/                  translation dictionaries
  context/               app-wide providers
  utils/                 shared utilities (incl. apiBase.js, permissions.js)
functions/               optional Firebase Cloud Functions (Blaze only; unused
                         on the free plan — see Backend below)
```

## Backend (Free-tier serverless)

The project is designed to run entirely on **free tiers**. Firebase is used for
**Auth + Firestore only** (Spark plan); since Cloud Functions require the Blaze
plan, all server-side logic runs as **Vercel serverless functions** implemented
as React Router resource routes (`app/routes/api.*`), with shared logic in
`src/server/`.

| Route | Purpose | Auth |
| --- | --- | --- |
| `POST /api/contact` | Contact form -> Firestore `messages` (honeypot + per-IP rate limit) | public |
| `GET /api/geo` | Geolocation proxy; keeps the paid ipify key server-side | public |
| `POST /api/auth-log` | Records login attempts (esp. failures) to `auditLogs` via Admin SDK, rate-limited per IP | public/optional token |
| `POST /api/db-sync` | Dispatches the GitHub Actions DB-sync workflow | Firebase ID token, superadmin only |

`functions/index.js` keeps an equivalent Cloud Functions implementation for
teams that prefer Blaze, but it is not used by the free-tier deployment.

## Security

- **Server-enforced RBAC** — `firestore.rules` is the authority for writes (the
  client permission UI is advisory). Content writes are gated per-module via
  `canWriteModule()`, which mirrors `src/utils/permissions.js`; custom roles are
  resolved from role-keyed `rolePermissions` documents, built-in roles fall back
  to tier defaults (fail-safe).
- **Audit log integrity** — `auditLogs` are append-only and schema-pinned; the
  recorded email must match the authenticated principal. Failed logins (no
  session) are written server-side via `/api/auth-log`.
- **No secrets in the client bundle** — the paid geolocation key lives only in
  the server `IPIFY_API_KEY` env var (proxied through `/api/geo`).
- **App Check (optional)** — set `VITE_RECAPTCHA_SITE_KEY` to enable reCAPTCHA v3
  attestation, then turn on enforcement for Firestore/Functions in the console.
- **Security headers / CSP** — configured in `firebase.json` for the Firebase
  Hosting origin.

## Environment Variables

Client (build-time, inlined into the bundle — must be non-secret):

```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID
VITE_RECAPTCHA_SITE_KEY        # optional, enables App Check
VITE_PRIMARY_CONTACT_ORIGIN    # optional, overrides the default Vercel API origin
```

Server (set in the **Vercel** project as Sensitive — never committed):

```
FIREBASE_SERVICE_ACCOUNT_JSON  # Admin SDK service account (JSON string)
GITHUB_DISPATCH_TOKEN          # GitHub PAT (Contents: read/write) for /api/db-sync
IPIFY_API_KEY                  # ipify geolocation key for /api/geo
```

> Geolocation keys are no longer client-side. `.env`/`.env.local` are git-ignored;
> only `.env.example` (placeholders) is committed.

## Tech Stack

- React 19
- React Router v7 (SSR on Vercel)
- Vite 7
- Firebase (Firestore + Auth, Spark/free plan)
- Vercel serverless functions (free tier) for backend API routes
- TanStack Query v5
- SCSS + CSS Modules
- Vitest

## Getting Started

### Install
```bash
git clone https://github.com/kemphearum/kemphearum.github.io.git
cd portfolio
npm install
```

### Seed Initial Database
Initialize your Firestore database with required configuration, sample content, and default layouts:
```bash
npm run seed -- --project your-firebase-project-id
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
- `npm run build` - production SSG build with route flattening
- `npm run preview` - preview production build
- `npm run seed` - populates Firestore with initial sample data and layout configuration
- `npm run lint` - lint project
- `npm test` - run unit tests
- `npm run deploy:firebase:hosting` - deploy static hosting only
- `npm run deploy:firebase:rules` - deploy Firestore security rules only
- `npm run deploy:firebase:backend` - deploy Functions + Firestore rules together

## Deployment

The app deploys to **Vercel** (primary, serves the SSR app + `/api/*` routes)
and is mirrored to GitHub Pages and Firebase Hosting (static).

### Vercel (backend + app)
- Pushing to `main` (or `npx vercel --prod`) builds and deploys the app and the
  serverless API routes.
- Set the **server env vars** (above) in the Vercel project as *Sensitive*
  before relying on `/api/db-sync`, `/api/geo`, or `/api/auth-log`. Env vars only
  apply to deploys made **after** they are added — redeploy after changing them.

### Firestore rules (deploy separately)
Security rules are **not** deployed by the hosting pipeline. After changing
`firestore.rules`:

```bash
npm run deploy:firebase:rules
```

When changing custom-role permissions, re-save each custom role once in the
admin UI so its `rolePermissions` document is keyed by role name (required by
the server-side RBAC rules).

> Note: `npm run deploy:firebase:backend` deploys Firebase Functions, which
> require the Blaze plan and are unused on the free-tier setup.

## License

MIT License

Built by KEM PHEARUM.
