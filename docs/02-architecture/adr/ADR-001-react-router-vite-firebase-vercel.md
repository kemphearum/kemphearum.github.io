# ADR-001: Use React Router 7, Vite, Firebase, and Vercel

## Status

Accepted

## Context

The repository already runs as a React Router 7 application built with Vite. Firebase provides Authentication and Firestore. Vercel is the primary SSR/API host, with Firebase Hosting and GitHub Pages documented as static mirrors.

## Decision

Keep React Router 7, Vite, Firebase, and Vercel as the approved application stack.

## Consequences

- Route and API behavior stays in `app/routes.ts` and `app/routes/*`.
- Firebase access stays in services and server-only helpers.
- Deployment work must remain compatible with Vercel Hobby and Firebase Spark.
- Do not introduce a replacement routing framework, backend framework, or database.

