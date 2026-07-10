# Collections and Documents

## Public Content Collections

- `posts`
- `projects`
- `experience`
- `skills`
- `certificates`
- `education`
- `awards`
- `publications`
- `speaking`

## Operational Collections

- `messages`
- `users`
- `rolePermissions`
- `auditLogs`
- `logs`
- `visits`
- settings and feature-flag documents

## Rule

Collection names and document shapes must be verified against services, indexes, rules, and production exports before migration or schema-freeze work.

## Service Mapping

| Collection / Area | Primary Service |
|---|---|
| `posts` | `BlogService` |
| `projects` | `ProjectService` |
| `experience` | `ExperienceService` |
| `skills` | `SkillService` |
| `certificates` | `CertificateService` |
| `education` | `EducationService` |
| `awards` | `AwardService` |
| `publications` | `PublicationService` |
| `speaking` | `SpeakingService` |
| `messages` | `MessageService` |
| `users`, `rolePermissions` | `UserService`, `PermissionService` |
| `auditLogs` | `AuditLogService` |
| `visits`, analytics data | `AnalyticsService` |
| settings and feature flags | `SettingsService` |
| database health/archive/restore | `DatabaseService` |
