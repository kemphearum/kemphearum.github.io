# Route Catalog

| Route | Module | Source |
|---|---|---|
| `/` | Home | `routes/_index.jsx` |
| `/admin` | Admin CMS | `routes/admin.jsx` |
| `/projects` | Projects index | `routes/projects._index.jsx` |
| `/projects/:slug` | Project detail | `routes/projects.$slug.jsx` |
| `/blog` | Blog index | `routes/blog._index.jsx` |
| `/blog/:slug` | Blog post | `routes/blog.$slug.jsx` |
| `/resume` | Resume | `routes/resume.jsx` |
| `/card` | Digital card | `routes/card.jsx` |
| `/sitemap.xml` | SEO | `routes/sitemap[.]xml.jsx` |
| `/rss.xml` | SEO | `routes/rss[.]xml.jsx` |
| `/robots.txt` | SEO | `routes/robots[.]txt.jsx` |
| `/:section` | Section redirect | `routes/section-redirect.jsx` |
| `*` | Not found | `routes/$.jsx` |

## API Route Catalog

| Route | Method Pattern | Module | Notes |
|---|---|---|---|
| `/api/contact` | server route action | Contact/messages | Public submission, server validation, Firestore write |
| `/api/geo` | server route loader/action | Analytics/geolocation | Server-side proxy so keys are not client-bundled |
| `/api/auth-log` | server route action | Auth/audit | Records authentication events |
| `/api/db-sync` | server route action | Database operations | Verifies Firebase token and superadmin email before GitHub dispatch |
| `/api/analytics` | server route | Analytics | Analytics endpoint behavior implemented in route/server logic |
