# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-03

### Added
- Complete public portfolio site (Hero, About, Experience, Projects, Blog, Contact).
- Fully-featured custom Admin CMS dashboard with role-based access control.
- Dark mode and Light mode dynamic theming.
- Multilingual support for English (`en`) and Khmer (`km`).
- Command palette for rapid keyboard navigation (`Cmd+K`).
- Markdown editor with live preview for blog posts and projects.
- Analytics, visitor geolocation, and immutable audit logging.
- Automated E2E testing suite (Playwright) and unit tests (Vitest).
- CI/CD pipelines via GitHub Actions and Vercel.
- Database maintenance utilities (Backup, Restore, Archive).

### Security
- Configured GitHub Actions for CodeQL and Dependabot.
- Server-enforced Firebase Firestore security rules for RBAC.
- Hidden backend serverless proxy for geolocation API keys.

[1.0.0]: https://github.com/kemphearum/kemphearum.github.io/releases/tag/v1.0.0
