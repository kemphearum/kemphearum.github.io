# Domain Model

## Domain Areas

- Public content: projects, blog posts, experience, skills, certificates, education, awards, publications, speaking, profile, and settings.
- Admin operations: users, roles, permissions, sessions, audit logs, messages, analytics visits, database operations, notifications, and feature flags.
- Shared domain behavior: status lifecycle, slug generation, localization, sorting, dates, and permission evaluation.

## Source

Domain behavior lives primarily in `src/domain/*`, `src/utils/*`, and services that load or persist normalized records.

