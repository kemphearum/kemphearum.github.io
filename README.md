# KEM PHEARUM — Portfolio

A modern, responsive personal portfolio built with **React**, **Firebase**, and **SCSS**. Features dark & light theme support, glassmorphism UI, animated sections powered by Framer Motion, a full-featured admin dashboard with role-based access control, and automated deployment to GitHub Pages.

🔗 **Live Sites**: [GitHub Pages](https://kemphearum.github.io/) | [Vercel](https://phearum-info.vercel.app/) | [Firebase (Primary)](https://phearum-info.web.app/) | [Firebase (Mirror)](https://kem-phearum.web.app/)

---

## ✨ Features

### Public Portfolio
- **Hero Section** — Animated greeting with profile image, floating particles, pulsing glow, and scroll indicator
- **About** — Bio and skill tags with hover effects and skeleton loading
- **Experience** — Timeline layout with glassmorphism cards, sorted by date
- **Projects** — Filterable project grid with tech-stack filter buttons and smooth layout animations. Includes direct **Telegram Sharing** integration.
- **Blog** — Custom Markdown blog system with syntax-highlighted code blocks, copy button, embedded media support, and `DOMPurify` HTML sanitization. Supports social sharing via **Telegram**.
- **Contact** — Contact form that saves messages to Firestore (features local rate-limiting and silent geolocation for spam prevention)
- **Footer** — Social links (GitHub, Email) with hover animations
- **🌗 Dark / Light Theme** — Toggle between dark and light modes; preference is saved to `localStorage` and respects the user's system setting by default

### Admin Dashboard
- 🔒 Firebase Auth login (Email/Password)
- 📝 Full CRUD for **Projects**, **Experience**, and **Blog Posts**
- 🏠 Advanced **Settings Tab** — Categorized sub-tab layout (Identity, Typography, Visuals, Site Sync) for deep site customization.
- 🎨 **Typography Engine** — Quick-switch between premium design presets (Signature Pro, Khmer Premium, etc.) with real-time preview.
- 📬 View and manage contact form **Messages**
- 👥 **User Management** with role-based access control (Superadmin / Admin / Editor / Viewer). Features refined UI for password resets and account management.
- 📋 **Audit Logs** — tracks login events, user actions, and admin activity
- 🔄 **Reusable Pagination** with items-per-page selector (5 / 10 / 25) across all tabs
- 🔍 **Search & Filter** on Experience, Projects, Blog, Users, and Audit Logs
- ⭐ **Featured Projects & Blog** toggle for homepage pinning
- 🖼️ Base64 image compression and direct Firestore storage (bypasses Firebase Storage limits)
- ⚙️ **Site Sync** — Full mirror management (Vercel, Firebase, GitHub Pages) and manual site rebuild triggers via GitHub Actions.
- 📱 **Premium Mobile UI** — Fully responsive admin panel optimized for Safari on iOS (iPhone 15 Pro testing)

### Technical Highlights
- **React Router v7 (SSG)** — Full Static Site Generation for lightning-fast loads and perfect SEO (replaces traditional CSR)
- **Clean URLs** — Modern navigation with no hashes (`/#/`), including automatic redirection for legacy links
- **SSR Compatibility** — Full ESM support for syntax highlighting and pre-rendering (zero-crash builds)
- **Custom Firebase hooks** (`useFirebaseDoc`, `useFirebaseCollection`) with in-memory caching and request deduplication
- **ThemeContext** with `ThemeProvider` for global dark/light mode state management
- **Skeleton loaders** for every data-fetching section
- **Framer Motion** animations with `AnimatePresence` for smooth transitions
- **Theme-proof CSS architecture** — all colors use CSS custom properties (`var(--text-primary)`, etc.) ensuring light/dark mode consistency across every component
- **SCSS Modules** with a shared design system (variables, glassmorphism mixin)
- **Full SEO Optimization** — dynamic meta tags, automated Sitemap/404 handling, and semantic HTML5
- **Dual Deployment** — Fully automated CI/CD pipeline deploying to both **GitHub Pages** (primary) and **Firebase Hosting** (backup)

---

## 🛠️ Tech Stack

| Category       | Technologies                                              |
|----------------|----------------------------------------------------------|
| **Core**       | React 19, Vite 7                                         |
| **Architecture**| React Router v7 (Full SSG / Hybrid)                      |
| **Styling**    | SCSS Modules, Framer Motion                              |
| **Backend**    | Firebase (Firestore, Auth)                               |
| **State**      | TanStack Query (React Query) v5                          |
| **Key Libs**   | `lucide-react`, `dompurify`, `react-markdown`            |
| **Deployment** | GitHub Actions (Auto-SSG + Multi-Cloud Deploy)           |

---

## 🚀 Getting Started

### Installation
```bash
git clone https://github.com/kemphearum/portfolio.git
cd portfolio
npm install
```

### Development
```bash
npm run dev
```

### Build & Static Generation
```bash
# This generates a full static version in build/client
npm run build
```

### Preview
```bash
npm run preview
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by **KEM PHEARUM**

