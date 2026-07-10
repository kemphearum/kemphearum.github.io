# Frontend Architecture

## Public Frontend

Public pages are under `src/pages`, with reusable presentation sections under `src/sections`. Details pages such as projects and blog posts are routed from `app/routes.ts`.

## Shared UI

Shared components live in `src/shared/components`. Styling uses SCSS and CSS Modules according to `ARCHITECTURE.md`.

## State and Data

TanStack Query provides caching and deduplication. Context providers manage language, theme, notifications, activity, and admin access.

