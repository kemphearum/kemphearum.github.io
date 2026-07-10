# Logical Architecture

## Layers

1. Routes: `app/routes.ts` and route modules.
2. Pages and sections: route composition and presentational rendering.
3. Hooks and contexts: state, auth, activity, notifications, language, and theme.
4. Domain: normalization, validation, status lifecycle, and slug logic.
5. Services: Firestore and API access.
6. Server: backend-only route helpers.
7. Firebase: Auth, Firestore, rules, and indexes.

## Dependency Direction

UI depends on hooks, domain, services, and shared components. Services own data access. Domain files should remain pure.

