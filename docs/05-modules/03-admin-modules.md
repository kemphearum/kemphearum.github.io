# Admin Modules

## Modules

Admin modules include dashboard, general content, blog, projects, experience, skills, certificates, education, awards, publications, speaking, messages, analytics, audit, database, settings, communication, profile, and user management.

## Pattern

New admin tabs should be registered through feature/content/nav/search/settings/dashboard registries instead of manually wiring many files.

## Sidebar Groups

| Group | Features |
|---|---|
| site_content | general, projects, blog |
| career | education, experience, skills, certificates |
| professional | awards, publications, speaking |
| communication | messages, communication |
| administration | database, users, audit, analytics, settings |

## Special Admin Entries

Dashboard, profile, home, about, profileInfo, and resume are registered features that participate in permission/search/settings behavior where applicable, but they are not all ordinary sidebar content tabs.
