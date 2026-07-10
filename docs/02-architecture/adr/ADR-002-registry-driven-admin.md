# ADR-002: Keep Admin CMS Registry-Driven

## Status

Accepted

## Context

The admin CMS derives capabilities from `src/registry/*` and feature descriptors. Navigation, content type loading, permissions, search, settings sections, and dashboard widgets all use registry-driven patterns.

## Decision

New admin capabilities must be registered through the feature, content type, navigation, permission, search, settings, and dashboard registry model when applicable.

## Consequences

- Adding a content type is a descriptor-driven change, not scattered manual wiring.
- Permission and navigation behavior are easier to audit.
- Admin modules should reuse shared CRUD and UI machinery instead of duplicating tab logic.

