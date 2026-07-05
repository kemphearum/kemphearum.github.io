# KEM PHEARUM - Portfolio

[![GitHub Release](https://img.shields.io/github/v/release/kemphearum/kemphearum.github.io?style=flat-square)](https://github.com/kemphearum/kemphearum.github.io/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/kemphearum/kemphearum.github.io/ci.yml?branch=main&style=flat-square)](https://github.com/kemphearum/kemphearum.github.io/actions)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red.svg?style=flat-square)](LICENSE)

A modern portfolio and secure administrative platform built with **React Router v7**, **Vite**, **Firebase**, and **SCSS**. 

Designed as a high-performance, accessible, and multilingual (English/Khmer) web application, it serves both as a public showcase of professional experience and a private, role-based Content Management System (CMS).

Live sites:
- **Vercel (Primary with SSR/API):** https://phearum-info.vercel.app/
- **Firebase (Static Mirror):** https://phearum-info.web.app/
- **GitHub Pages (Static Mirror):** https://kemphearum.github.io/

---

## 📖 Project Overview

This repository houses the complete source code for Kem Phearum's personal portfolio. It goes beyond a simple static site by integrating a fully-fledged custom CMS. The architecture guarantees a 100% free-tier deployment (using Vercel for serverless API execution and Firebase for database/auth) without compromising on security, performance, or SEO.

## ✨ Key Features

### Public Site
- **Dynamic Content:** Hero, About, Experience, Projects, and Blog sections powered by Firestore.
- **Multilingual Support:** First-class support for English (`en`) and Khmer (`km`), with smart font fallbacks and language persistence.
- **Theming:** Persistent Light and Dark mode toggles with CSS variables.
- **Rich Blog:** Markdown rendering with sanitization, code syntax highlighting, and responsive typography.
- **SEO & Accessibility:** Auto-generated `sitemap.xml` and `rss.xml`, semantic HTML, and strict WCAG contrast compliance.
- **Interactive Background:** High-performance animated canvas background utilizing Framer Motion.

### Admin Dashboard (CMS)
- **User Management (IAM):** Comprehensive interface for managing users, sessions, activity logs, and granular Role-Based Access Control (RBAC).
- **Content Management:** Full CRUD interfaces for Projects, Experience, and Blog posts with localized field support.
- **Settings & Configuration:** Manage identity, typography, visual themes, and external integrations directly from the UI.
- **Database Maintenance:** Built-in tools to trigger full JSON backups, restore snapshots, and archive operational data.
- **Analytics & Audit:** Tracks visitor geolocation (via serverless proxy), login attempts, and detailed audit logs.
- **Command Palette:** Global keyboard navigation (`Cmd+K`) for rapid administrative tasks.

---

## 🛠 Technology Stack

- **Framework:** React 19, React Router v7 (SSR)
- **Build Tool:** Vite 7
- **Database & Auth:** Firebase (Firestore, Authentication) - Spark Plan
- **Backend APIs:** Vercel Serverless Functions
- **State Management:** TanStack Query v5
- **Styling:** Vanilla SCSS & CSS Modules (No Tailwind)

- **CI/CD:** GitHub Actions (lint on push/PR, Vercel auto-deploy)

---

## 📐 Architecture

The application is strictly layered to separate presentation, data access, and backend logic:

```text
app/
  routes/                React Router routes, incl. serverless API routes:
                           api.contact.jsx  -> POST /api/contact
                           api.geo.jsx       -> GET  /api/geo
                           api.authLog.jsx   -> POST /api/auth-log
                           api.dbSync.jsx    -> POST /api/db-sync
  routes.ts              route table
src/
  domain/                Pure business logic, validation, and normalizers
  services/              Firestore service layer (client-side data access)
  sections/              Public UI components and layout sections
  pages/admin/           Modular admin dashboard tabs
  server/                Server-only logic for API routes (Admin SDK)
  shared/components/     Reusable UI components (Buttons, Modals, DataTables)
  hooks/                 Reusable React hooks
  i18n/                  Translation dictionaries
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a deeper dive into the technical design, directory structures, and design decisions.

## 🚀 Installation & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/kemphearum/kemphearum.github.io.git
cd kemphearum.github.io
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and fill in your Firebase project credentials.
```bash
cp .env.example .env.local
```
*(Note: Geolocation and Serverless functions require additional `FIREBASE_SERVICE_ACCOUNT_JSON` and `IPIFY_API_KEY` variables to be set in your Vercel deployment environment).*

### 4. Seed the Database
Initialize your Firestore database with required configurations and default layout schema.
```bash
npm run seed -- --project your-firebase-project-id
```

### 5. Start Development Server
```bash
npm run dev
```

---

## 📦 Deployment

The application is designed for a hybrid deployment model to maximize the free tier.

### 1. Vercel (Primary & Backend)
Pushing to the `main` branch automatically triggers a Vercel deployment. Vercel hosts the SSR React Router application and executes the `/api/*` serverless functions. Ensure server environment variables are configured in the Vercel dashboard as *Sensitive*.

### 2. Firebase (Database & Rules)
Firestore security rules must be deployed manually when updated:
```bash
npm run deploy:firebase:rules
```

---

## 🔒 Security

Security is deeply integrated into the architecture:
- **Server-enforced RBAC:** Client-side permissions are advisory; `firestore.rules` is the final authority, resolving custom roles against `rolePermissions` documents.
- **Immutable Audit Logs:** Failed logins and operational changes are recorded via server-side APIs to prevent client tampering.
- **Secret Management:** Sensitive API keys (e.g., Geolocation) are never bundled to the client. They are kept in Vercel environment variables and proxied through internal `/api` endpoints.
- **Dependency Management:** Dependencies are reviewed and updated manually using `npm outdated` / `npm update` to avoid automated PRs causing version conflicts.

If you discover a security vulnerability, please refer to [SECURITY.md](SECURITY.md).

---

## ⚡ Performance & Accessibility

- **Zero Layout Shift:** Image placeholders and dynamic font loading strategies ensure stable rendering.
- **A11y Compliant:** Semantic HTML, ARIA attributes, and robust keyboard navigation (`Cmd+K`) are baked in.
- **Caching:** TanStack Query handles client-side caching and deduplication to minimize Firestore read operations.

---

## 🗺 Roadmap

- [x] Initial SSG Public Release
- [x] Firebase CMS Integration
- [x] Multilingual Support (EN/KM)

- [x] **v1.0.0 Release** 
- [ ] Exportable PDF Resume Generator Enhancements
- [ ] Advanced Analytics Dashboard Visualization

---

## 📜 License & Code of Conduct

**License:** All Rights Reserved. See [LICENSE](LICENSE) for details.
**Conduct:** Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before interacting with the repository.

---

**Built with ❤️ by Kem Phearum**
