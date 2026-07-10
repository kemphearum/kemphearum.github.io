# Configuration Management

## Configuration Sources

- Firebase client configuration: `src/firebase.js` and environment variables.
- Hosting and rewrites: `vercel.json` and `firebase.json`.
- Build and aliases: `vite.config.js`, `jsconfig.json`, and `react-router.config.ts`.
- Admin settings: Firestore-backed settings rendered through `SettingsService` and settings registry sections.

## Control Rule

Do not add or change environment variables, scripts, hosting config, or Firebase config during documentation tasks.

