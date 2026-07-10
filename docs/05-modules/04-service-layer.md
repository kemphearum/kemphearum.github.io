# Service Layer

## Responsibility

Services own Firestore/API access and business operations that interact with persistence.

## Observed Services

Services include analytics, audit logs, auth, awards, blog, certificates, communication, content, database, education, experience, image processing, messages, multilingual migration, projects, publications, resume, settings, skills, speaking, users, and permissions.

## Rule

Components and hooks should call services rather than raw Firebase APIs.

