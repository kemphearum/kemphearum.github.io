# Error Handling

## Public Routes

Route-level errors should preserve user-friendly fallback behavior and not expose sensitive internals.

## Admin Routes

Admin workflows should surface actionable toasts through the notification system and preserve auditability for mutating operations.

## API Routes

API routes should return appropriate HTTP status codes and avoid leaking secrets, stack traces, or service account details.

