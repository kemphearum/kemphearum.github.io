# ADR-004: Preserve Zero-Cost Architecture

## Status

Accepted

## Context

Project instructions require the portfolio to stay deployable on GitHub Free, Firebase Spark, and Vercel Hobby.

## Decision

Do not introduce Firebase Storage, Cloud Functions, Cloud Scheduler, Blaze-only services, paid APIs, external background jobs, or runtime dependencies that require paid infrastructure.

## Consequences

- Status scheduling is computed at read time.
- Database operations use client/serverless-compatible Firestore flows.
- Sync operations use GitHub dispatch rather than Cloud Functions.
- Any future paid-service proposal requires explicit approval and a documented architecture decision.

