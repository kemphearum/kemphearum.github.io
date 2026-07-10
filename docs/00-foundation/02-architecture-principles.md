# Architecture Principles

## Principles

- Keep React Router 7 as the route and SSR framework.
- Keep Vite as the build tool.
- Keep Firebase Authentication and Firestore as the data platform.
- Keep Vercel as the primary SSR/API host.
- Keep the source layering from `ARCHITECTURE.md`: component to hook to service/domain to Firebase.
- Keep admin behavior registry-driven where registries already exist.
- Keep public content CMS-backed rather than hardcoded in sections.

## Boundary Rules

Components and sections must not call Firestore directly. Services own data access, domain files own normalization and pure logic, and server files own backend-only API behavior.

