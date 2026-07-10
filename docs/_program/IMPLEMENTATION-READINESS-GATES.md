# Implementation Readiness Gates

## Gate 1: Documentation Scope

Documentation changes are complete when the requested phase structure exists, `docs/VERSIONING.md` remains intact, and no source, config, Firebase, or package files changed.

## Gate 2: Architecture Consistency

Any future implementation work must preserve the existing React Router 7, Vite, Firebase, Vercel, service/domain/section/page layering, and registry-driven admin architecture.

## Gate 3: Security Review

Changes touching `firestore.rules`, auth services, admin access context, server API handlers, Firebase config, or environment files require explicit security impact notes.

## Gate 4: Quality Verification

Run `npm run lint` after changes touching `src/` or `app/`. UI changes require desktop, tablet, mobile, accessibility, and SEO checks.

## Gate 5: Zero-Cost Constraint

Do not introduce Firebase Storage, Cloud Functions, Cloud Scheduler, Blaze-only services, paid APIs, external background jobs, or new hosting assumptions.

