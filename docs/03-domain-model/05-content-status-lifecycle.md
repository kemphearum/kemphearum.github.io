# Content Status Lifecycle

## Source of Truth

`src/domain/shared/contentStatus.js` is the single source for effective content status.

## Lifecycle

Content can use stored status values such as draft, scheduled, published, and archived, with `publishAt`, `expireAt`, `publishedAt`, and `archivedAt` fields where status-capable types support them.

## Zero-Cost Rule

Status is computed at read time rather than flipped by a background job, preserving the no-scheduler zero-cost constraint.

