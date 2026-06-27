# Agent Instructions — portfolio

React Router 7 + Vite + Firebase personal portfolio. These rules govern how AI coding agents work in this repo. (Claude-specific instructions also live in `.claude/CLAUDE.md` — kept in sync with this file.)

## Project Context

- This is a personal cybersecurity and governance portfolio site. Its purpose is to showcase ISO/IEC 27001:2022 implementation experience, ISMS governance, risk management, security policy authorship, secure SDLC practice, compliance mapping, audit participation, and related technical projects.
- Content (About, Experience, Projects, Blog) is CMS-driven: stored in Firestore, managed via `Admin.jsx` / `src/pages/admin`, fetched through `src/services/*Service.js`, normalized in `src/domain/*`, and rendered by `src/sections/*`.
- All portfolio copy must read as professional and credible — practical implementation experience and measurable outcomes (risk reduced, controls implemented, audit findings closed, time-to-compliance) over generic claims.

## Architecture Guidance

- Use the existing React Router 7 + Firebase architecture only — do not introduce alternative routing, state management, or backend frameworks.
- Respect the existing layering: `domain/` for data normalization and pure logic, `services/` for Firestore/API access, `sections/` for presentational components, `pages/` for route-level composition, `server/` for backend-only logic (contact, auth-log, geo, db-sync). Don't collapse these layers together.
- Prefer extending an existing section or service over creating a new one. New CMS-backed content types should follow the same pattern as `Experience`/`Project` (domain normalizer + service + section + Firestore rules entry).
- Keep content, presentation, and data separated: section components should not embed raw Firestore queries or hardcoded copy — copy comes from the content model (with i18n via `useTranslation`/`getLocalizedField`), data access goes through a service.
- Admin CRUD tabs (blog, projects, experience, skills, certificates) share their list/selection/mutation/import machinery via `src/pages/admin/hooks/useAdminCrud.js`, `adminCrudIO.js`, and `components/BulkActionsBar.jsx`. Build new admin tabs on these rather than duplicating tab logic.
- The admin panel is registry-driven (`src/registry/*`): `contentTypeRegistry` (nav + routing + titles), `navRegistry`, `searchRegistry` (Cmd/Ctrl+K palette), `settingsRegistry`, `dashboardWidgetRegistry`. Adding a content type, settings section, or dashboard card should mean registering a descriptor, not editing many files. Scheduling uses a runtime effective-status util (`src/domain/shared/contentStatus.js`), notifications a central service (`src/context/NotificationContext.jsx`). See `src/pages/admin/README.md`.
- Zero-cost constraint (hard): the project must stay deployable on GitHub Free + Firebase Spark + Vercel Hobby. Never introduce Firebase Storage, new Cloud Functions, Cloud Scheduler, Blaze services, background jobs, or paid APIs — use Firestore docs, client/SSR logic, and `localStorage` only.
- Optimize for maintainability, performance (avoid unnecessary re-renders, keep bundle size in check), accessibility, SEO (routes already include `sitemap.xml` — keep metadata consistent), and mobile responsiveness (SCSS modules, check breakpoints already in use).

## Security Requirements

- Follow secure coding practices throughout; this is a security-focused portfolio and the code itself is part of the credibility story.
- Validate and sanitize all user input, especially in `routes/api.contact.jsx`, `routes/api.authLog.jsx`, `routes/api.dbSync.jsx`, `routes/api.geo.jsx`, and any Admin form that writes to Firestore.
- Never expose secrets, API keys, tokens, Firebase credentials, or sensitive configuration in code, comments, logs, or client-bundled files. `.env`, `.env.local`, `.env.example`, and `src/firebase.js` config are sensitive to drift — flag before changing.
- Apply least-privilege principles for any Firebase/Firestore change. `firestore.rules` already implements role-based access (`anonymous`, signed-in, admin/superadmin) — new collections or fields must get explicit rules, not inherit broad defaults. Keep `firestore.rules` and `firestore.rules.test.mjs` in sync.
- Treat changes to authentication (`AuthService.js`, `src/context` auth provider), storage, database access (`DatabaseService.js`, `src/server/*`), or routing logic as security-sensitive: explain the security impact before/after the change, not just the functional behavior.

## Portfolio Content Standards

- Write concise, professional, recruiter-friendly content. No marketing language, no exaggerated claims ("expert", "guru", "world-class") — state what was implemented, governed, audited, or reduced, with specifics where available.
- Prioritize business impact, governance outcomes, risk reduction, and compliance achievements alongside technical implementation detail — both matter, neither stands alone.
- Keep tone, structure, and terminology consistent across all content-bearing sections (About, Experience, Projects, Blog) and any future Skills/Certifications content — same ISO 27001 vocabulary, same level of formality, same date/period formatting (see `experienceDomain.js`).

## Quality Gates

- Run `npm run lint` and the relevant `npm run test` subset after any change touching `src/` or `app/`.
- Verify responsive behavior at desktop, tablet, and mobile breakpoints for any UI change.
- Check accessibility (semantic HTML, landmarks, alt text, focus order, contrast) and SEO metadata for any new or changed section/page.
- Confirm no broken routes, links, images, or Firebase reads/writes before calling a change complete — check both signed-out and signed-in/admin states where relevant.

## Agent Behavior

- Review the existing implementation (service, domain, section, route) before proposing a new pattern.
- Prefer enhancing an existing component/service over creating a new structure; only add new files when nothing existing reasonably covers the need.
- Challenge — don't silently accept — design decisions that would reduce maintainability, security, accessibility, or performance, even if requested. Say why before implementing an alternative.
- When multiple valid approaches exist, recommend the simplest one consistent with the current architecture; flag tradeoffs rather than picking silently.

## Tone and Response Format

- Be concise. No bullet-heavy explanations — describe changes in 1–3 sentences of prose, not lists.
- After any edit, state what changed and why in one short paragraph. Do not re-explain the whole task or restate unchanged context.
- No code comments unless explicitly asked for.
- No filler ("Let me...", "Now I'll...") before tool calls.

## Code Conventions — Match What's Already There

- Do not introduce new libraries, patterns, or formatting conventions not already present in `package.json` or the codebase. If a new dependency seems necessary, ask first.
- Match existing file organization: `src/components`, `src/pages`, `src/sections`, `src/hooks`, `src/context`, `src/domain`, `src/services`, `src/server`, `src/shared`, `src/utils`, `src/i18n`, `src/styles`. Place new files in the directory matching their role — don't invent new top-level folders.
- JS/JSX only (no TS migration) — type hints come from `@types/react` and `jsconfig.json`, not TypeScript files.
- Follow the existing ESLint config (`eslint.config.js`) — flat config, `react-hooks` + `react-refresh` recommended rules, `no-unused-vars` with `^[A-Z_]` ignore pattern. Run `npm run lint` after non-trivial changes.
- Routing is React Router 7 (`app/routes.ts`, `app/routes/`) — use existing route patterns, not raw `react-router-dom` APIs unless already used that way in this repo.
- Firebase: never hand-edit generated/build artifacts (`build/`, `dist/`, `.firebase/`, `.react-router/`). Firestore rules changes go in `firestore.rules` and must stay consistent with `firestore.rules.test.mjs`.
- Tests use Vitest + Testing Library (`@testing-library/react`, `jsdom`). New components/utilities with logic should get a colocated test unless told otherwise.

## Working Style

- Make minimal, targeted diffs. Don't refactor unrelated code while fixing something else.
- Prefer editing existing files over creating new ones.
- Don't add new env vars, scripts, or config without flagging it first — `.env`, `.env.local`, `.env.example`, `firebase.json`, `vite.config.js`, `react-router.config.ts` are sensitive to drift.
- Before declaring a task done: run `npm run lint` and `npm run test` (or the relevant subset) if the change touches `src/` or `app/`.

