# Frontend Service Integration

## Data Flow

Frontend UI flows from pages and sections into hooks, services, domain normalizers, and Firestore. Components should not call Firebase directly.

## Integration Surfaces

- Public pages read content through services such as `ProjectService`, `BlogService`, `ExperienceService`, and related domain files.
- Admin tabs call shared CRUD hooks and service methods.
- TanStack Query caches lists, stats, search results, and dashboard data.
- Context providers coordinate language, theme, notifications, activity tracking, and admin access.

## Rule

When adding a new content type, define the domain normalizer, service access, admin registry descriptors, Firestore rules, and public/admin rendering path together.

