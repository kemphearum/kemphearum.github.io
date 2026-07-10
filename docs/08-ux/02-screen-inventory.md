# Screen Inventory

## Public Screens

Home, projects index, project detail, blog index, blog post, resume, card, section redirect, not found, sitemap, RSS, and robots outputs.

## Admin Screens

Dashboard, general/profile/settings, content CRUD tabs, analytics, audit, messages, communication, database, user management, command palette, dialogs, forms, import/export flows, and history/restore views.

## Public Route Screens

| Screen | Route | Source |
|---|---|---|
| Home | `/` | `src/pages/Home.jsx` |
| Projects index | `/projects` | `src/pages/ProjectsPage.jsx` |
| Project detail | `/projects/:slug` | `src/pages/ProjectDetail.jsx` |
| Blog index | `/blog` | `src/pages/Blog.jsx` |
| Blog post | `/blog/:slug` | `src/pages/BlogPost.jsx` |
| Resume | `/resume` | `src/pages/Resume.jsx` |
| Digital card | `/card` | `src/pages/card/CardPage.jsx` |
| Not found | `*` | `src/pages/NotFound.jsx` |

## Admin Tab Screens

| Admin Area | Source |
|---|---|
| Dashboard | `src/pages/admin/dashboard/DashboardTab.jsx` |
| General | `src/pages/admin/general/GeneralTab.jsx` |
| Blog | `src/pages/admin/blog/BlogTab.jsx` |
| Projects | `src/pages/admin/projects/ProjectsTab.jsx` |
| Experience | `src/pages/admin/experience/ExperienceTab.jsx` |
| Skills | `src/pages/admin/skills/SkillsTab.jsx` |
| Certificates | `src/pages/admin/certificates/CertificatesTab.jsx` |
| Education | `src/pages/admin/education/EducationTab.jsx` |
| Awards | `src/pages/admin/awards/AwardTab.jsx` |
| Publications | `src/pages/admin/publications/PublicationTab.jsx` |
| Speaking | `src/pages/admin/speaking/SpeakingTab.jsx` |
| Messages | `src/pages/admin/messages/MessagesTab.jsx` |
| Communication | `src/pages/admin/communication/CommunicationTab.jsx` |
| Analytics | `src/pages/admin/analytics/AnalyticsTab.jsx` |
| Audit | `src/pages/admin/audit/AuditLogsTab.jsx` |
| Database | `src/pages/admin/database/DatabaseTab.jsx` |
| Settings | `src/pages/admin/settings/SettingsTab.jsx` |
| User management | `src/pages/admin/user-management/UserManagementTab.jsx` |
