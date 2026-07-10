# Content Entities

## Entities

Content entities are represented by domain-specific normalizers and services: blog posts, projects, experience, skills, certificates, education, awards, publications, speaking entries, profile/general content, and settings.

## Common Fields

Common content patterns include localized text fields, visibility/effective status fields, created/updated timestamps, featured flags where applicable, slugs for public routes, and media fields stored within Firestore-compatible records.

## Source

Use `src/domain/*Domain.js`, `src/services/*Service.js`, and Firestore indexes as the schema reference.

