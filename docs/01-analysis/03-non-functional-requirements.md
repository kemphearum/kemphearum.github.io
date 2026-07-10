# Non-Functional Requirements

## Security

Validate user input, protect admin routes, enforce least privilege in Firestore rules, and keep secrets out of client bundles.

## Performance

Minimize Firestore reads, use TanStack Query caching, keep bundle size in check, and preserve fast SSR/prerender behavior.

## Accessibility

All public and admin interfaces should support keyboard navigation, semantic structure, readable contrast, responsive layouts, and labelled controls.

## Maintainability

Use existing layers and registries. Avoid duplicate admin tab logic, raw Firestore calls in components, and unrelated refactors.

