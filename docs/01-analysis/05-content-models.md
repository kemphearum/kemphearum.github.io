# Content Models

## Content Types

Observed content domains include blog posts, projects, experience, skills, certificates, education, awards, publications, speaking entries, profile/general content, settings, messages, users, visits, and audit logs.

## Domain Normalizers

Content normalization lives under `src/domain/*`, with shared status behavior in `src/domain/shared/contentStatus.js` and slug behavior in `src/domain/shared/slugify.js`.

## Localization

Localized fields use English and Khmer content patterns. Public and admin UI read translations from `src/i18n/en.json` and `src/i18n/km.json`.

