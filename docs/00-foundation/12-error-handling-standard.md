# Error Handling Standard

## Public Experience

Public pages should fail gracefully, preserve SEO-safe route behavior, and avoid exposing stack traces or internal service details.

## Admin Experience

Admin workflows should surface actionable errors through toasts, dialogs, retry states, or table empty/error states. Mutating failures should not leave users unsure whether a write happened.

## API Experience

API routes should validate method and payload, return appropriate HTTP status codes, and avoid leaking secrets or implementation internals.

