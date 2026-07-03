# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-07-03

### Changed
- Removed Playwright, Vitest, and all testing infrastructure (no test suite for this personal portfolio).
- Removed Dependabot (dependencies managed manually via `npm outdated`).
- Aligned `react` and `react-dom` to 19.2.7 to fix Vercel build failure.
- Updated all documentation to remove stale references to testing and Dependabot.

---

## [1.0.0] - 2026-07-03

### Added
- Complete public portfolio site (Hero, About, Experience, Projects, Blog, Contact).
- Fully-featured custom Admin CMS dashboard with role-based access control.
- Dark mode and Light mode dynamic theming.
- Multilingual support for English (`en`) and Khmer (`km`).
- Command palette for rapid keyboard navigation (`Cmd+K`).
- Markdown editor with live preview for blog posts and projects.
- Analytics, visitor geolocation, and immutable audit logging.
- CI/CD pipelines via GitHub Actions and Vercel.
- Database maintenance utilities (Backup, Restore, Archive).

### Security
- Server-enforced Firebase Firestore security rules for RBAC.
- Hidden backend serverless proxy for geolocation API keys.

[1.0.0]: https://github.com/kemphearum/kemphearum.github.io/releases/tag/v1.0.0
