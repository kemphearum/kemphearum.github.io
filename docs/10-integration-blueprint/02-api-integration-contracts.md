# API Integration Contracts

## Route Contracts

API routes are React Router route modules and delegate backend-only work to `src/server/*`.

| API Route | Server Module | Primary Contract |
|---|---|---|
| `/api/contact` | `contactSubmission.js` | Validate public contact payload and persist message |
| `/api/geo` | `geoLookup.js` | Proxy geolocation lookup without exposing keys |
| `/api/auth-log` | `authAudit.js` | Record authentication/security audit events |
| `/api/db-sync` | `databaseSync.js` | Verify superadmin token and dispatch GitHub database sync workflow |
| `/api/analytics` | Analytics route/server logic | Capture or serve analytics behavior where implemented |

## Error Contract

API responses should include clear success/error shapes, appropriate HTTP status codes, and no sensitive internals.

