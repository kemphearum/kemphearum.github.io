# Validation Rules

## Client and Domain Validation

Validation is split between domain normalizers, admin form components, services, API route handlers, and Firestore rules.

## Server Validation

API routes such as contact, auth log, geo, analytics, and database sync use server modules in `src/server/*` to validate and process payloads.

## Firestore Rules Validation

`firestore.rules` validates key payloads such as visit records and gates write permissions by role and module capability.

