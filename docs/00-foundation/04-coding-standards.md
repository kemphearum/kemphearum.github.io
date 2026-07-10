# Coding Standards

## Source Style

Use JS/JSX only. Do not migrate files to TypeScript. Follow `eslint.config.js`, `jsconfig.json`, existing absolute imports through `@/`, and the current SCSS/CSS Module conventions.

## Architecture Style

Keep business logic out of components. Use hooks for state and side effects, domain files for normalization and validation, services for Firestore/API access, and server files for backend-only behavior.

## Comments

Project instructions prefer no new code comments unless explicitly requested. Documentation should explain decisions instead of adding explanatory comments to source files.

