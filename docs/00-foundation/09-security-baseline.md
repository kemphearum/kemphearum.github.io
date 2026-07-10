# Security Baseline

## Security Model

The security model combines Firebase Authentication, role and permission data in Firestore, server API validation, admin UI gating, and authoritative Firestore rules.

## Sensitive Surfaces

- `firestore.rules`
- `src/services/auth/*`
- `src/services/AuthService.js`
- `src/context/AdminAccessContext.jsx`
- `src/server/*`
- `app/routes/api.*.jsx`
- `.env*` and Firebase config files

## Baseline Requirement

Client-side checks are advisory. Firestore rules and server-side validation are the enforcement boundary for protected data and sensitive operations.

