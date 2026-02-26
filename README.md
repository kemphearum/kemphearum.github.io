# KEM PHEARUM — Portfolio

A modern, responsive personal portfolio built with **React**, **Firebase**, and **SCSS**. Features dark & light theme support, glassmorphism UI, animated sections powered by Framer Motion, a full-featured admin dashboard with role-based access control, and automated deployment to GitHub Pages.

🔗 **Live Site**: [kemphearum.github.io](https://kemphearum.github.io/)

---

## ✨ Features

### Public Portfolio
- **Hero Section** — Animated greeting with profile image, floating particles, pulsing glow, and scroll indicator
- **About** — Bio and skill tags with hover effects and skeleton loading
- **Experience** — Timeline layout with glassmorphism cards, sorted by date
- **Projects** — Filterable project grid with tech-stack filter buttons and smooth layout animations
- **Blog** — Custom Markdown blog system with syntax-highlighted code blocks, copy button, embedded media support, and `DOMPurify` HTML sanitization
- **Contact** — Contact form that saves messages to Firestore (features local rate-limiting for spam prevention)
- **Footer** — Social links (GitHub, Email) with hover animations
- **🌗 Dark / Light Theme** — Toggle between dark and light modes; preference is saved to `localStorage` and respects the user's system setting by default

### Admin Dashboard
- 🔒 Firebase Auth login (Email/Password)
- 📝 Full CRUD for **Projects**, **Experience**, and **Blog Posts**
- 🏠 Edit **Home**, **About**, **Contact**, and **General Settings** content
- 📬 View and manage contact form **Messages**
- 👥 **User Management** with role-based access control (Superadmin / Admin / Editor / Viewer)
- 📋 **Audit Logs** — tracks login events, user actions, and admin activity
- 🔄 **Reusable Pagination** with items-per-page selector (5 / 10 / 25) across all tabs
- 🔍 **Search & Filter** on Experience, Projects, Blog, Users, and Audit Logs
- ⭐ **Featured Projects & Blog** toggle for homepage pinning
- 🖼️ Base64 image compression and direct Firestore storage (bypasses Firebase Storage limits)
- 🔔 Toast notifications and custom confirmation modals
- 📱 Responsive sidebar with mobile drawer

### Technical Highlights
- **Custom Firebase hooks** (`useFirebaseDoc`, `useFirebaseCollection`) with in-memory caching and request deduplication
- **ThemeContext** with `ThemeProvider` for global dark/light mode state management
- **Skeleton loaders** for every data-fetching section
- **Framer Motion** animations with `AnimatePresence` for smooth transitions
- **Theme-proof CSS architecture** — all colors use CSS custom properties (`var(--text-primary)`, etc.) ensuring light/dark mode consistency across every component
- **SCSS Modules** with a shared design system (variables, glassmorphism mixin)
- **React Router** (`react-router-dom`) for client-side routing
- **Error Boundary** component for graceful error handling
- **SEO optimized** with meta tags, semantic HTML, and proper heading hierarchy

---

## 🛠️ Tech Stack

| Category       | Technologies                                              |
|----------------|----------------------------------------------------------|
| **Frontend**   | React 19, Vite 7, SCSS Modules, Framer Motion           |
| **Routing**    | React Router DOM 7                                       |
| **Backend**    | Firebase (Firestore, Auth)                               |
| **Key Libs**   | `browser-image-compression`, `dompurify`, `react-markdown`|
| **Deployment** | GitHub Pages via GitHub Actions                          |
| **Fonts**      | Inter (Google Fonts)                                     |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by **KEM PHEARUM**

