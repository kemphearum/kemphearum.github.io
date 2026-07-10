# API Standards

## Route Platform

API routes are React Router route modules under `app/routes/api.*.jsx`.

## Standards

- Validate request method and payload shape.
- Keep secrets and Firebase Admin behavior server-only.
- Return structured status codes and clear JSON responses.
- Do not expose service account or environment details to clients.
- Use server modules under `src/server/*` for backend-only logic.

