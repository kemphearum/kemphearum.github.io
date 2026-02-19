# Kem Phearum — Portfolio

A modern, responsive personal portfolio built with **React**, **Firebase**, and **SCSS**. Features a glassmorphism dark theme, animated UI powered by Framer Motion, a full-featured admin dashboard, and automated deployment to GitHub Pages.

🔗 **Live Site**: [kemphearum.github.io](https://kemphearum.github.io/)

---

## ✨ Features

### Public Portfolio
- **Hero Section** — Animated greeting with profile image, floating particles, pulsing glow, and scroll indicator
- **About** — Bio and skill tags with hover effects and skeleton loading
- **Experience** — Timeline layout with glassmorphism cards, sorted by date
- **Projects** — Filterable project grid with tech-stack filter buttons and smooth layout animations
- **Contact** — Contact form that saves messages to Firestore with success/error feedback
- **Footer** — Social links (GitHub, Email) with hover animations

### Admin Dashboard (`/#/admin`)
- 🔒 Firebase Auth login (Email/Password)
- 📝 Full CRUD for **Experience** and **Projects**
- 🏠 Edit **Home**, **About**, **Contact**, and **General Settings** content
- 📬 View and manage contact form **Messages**
- 🖼️ Image upload to Firebase Storage (projects, profile photo)
- 🔔 Toast notifications instead of browser alerts
- 📱 Responsive sidebar with mobile drawer

### Technical Highlights
- **Custom Firebase hooks** (`useFirebaseDoc`, `useFirebaseCollection`) with in-memory caching and request deduplication
- **Skeleton loaders** for every data-fetching section
- **Framer Motion** animations with `AnimatePresence` for smooth transitions
- **SCSS Modules** with a shared design system (variables, glassmorphism mixin)
- **Error Boundary** component for graceful error handling
- **SEO optimized** with meta tags, semantic HTML, and proper heading hierarchy

---

## 🛠️ Tech Stack

| Category       | Technologies                                    |
|----------------|------------------------------------------------|
| **Frontend**   | React 19, Vite 7, SCSS Modules, Framer Motion |
| **Backend**    | Firebase (Firestore, Auth, Storage)            |
| **Deployment** | GitHub Pages via `gh-pages`                    |
| **Fonts**      | Inter (Google Fonts)                           |

---

## 📁 Project Structure

```
portfolio/
├── public/
├── src/
│   ├── components/
│   │   ├── Hero.jsx / Hero.module.scss
│   │   ├── About.jsx / About.module.scss
│   │   ├── Experience.jsx / Experience.module.scss
│   │   ├── Projects.jsx / Projects.module.scss
│   │   ├── ProjectCard.jsx / ProjectCard.module.scss
│   │   ├── Contact.jsx / Contact.module.scss
│   │   ├── Navbar.jsx / Navbar.module.scss
│   │   ├── Footer.jsx / Footer.module.scss
│   │   └── ErrorBoundary.jsx
│   ├── hooks/
│   │   └── useFirebaseData.js      # Custom caching hooks
│   ├── pages/
│   │   └── Admin.jsx / Admin.module.scss
│   ├── styles/
│   │   ├── variables.scss          # Design tokens & mixins
│   │   └── global.scss             # Global styles & CSS variables
│   ├── firebase.js                 # Firebase configuration
│   ├── App.jsx                     # Routes & layout
│   └── main.jsx                    # Entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A [Firebase](https://firebase.google.com/) project
- A [GitHub](https://github.com/) account

### Installation

```bash
# Clone the repository
git clone https://github.com/kemphearum/kemphearum.github.io.git
cd kemphearum.github.io

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`.

---

## 🔥 Firebase Setup

### 1. Create a Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click **Add project** and follow the setup wizard

### 2. Enable Authentication
- Navigate to **Build → Authentication → Get started**
- Enable **Email/Password** provider
- Add an admin user under the **Users** tab

### 3. Enable Firestore Database
- Go to **Build → Firestore Database → Create database**
- Set the following security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Content (home, about, contact, general) — public read, auth write
    match /content/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Experience — public read, auth write
    match /experience/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Projects — public read, auth write
    match /projects/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Messages — anyone can create, only auth can read/delete
    match /messages/{document} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### 4. Enable Storage
- Go to **Build → Storage → Get started**
- Set rules to allow public read, authenticated write:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Add Firebase Config
- Go to **Project Settings → Your apps → Web app**
- Register your app and copy the config
- Update `src/firebase.js` with your config values

---

## 📊 Firestore Data Structure

### Collection: `content`
| Document   | Fields                                                                              |
|------------|------------------------------------------------------------------------------------|
| `home`     | `greeting`, `name`, `subtitle`, `description`, `ctaText`, `ctaLink`, `profileImageUrl` |
| `about`    | `bio` (string), `skills` (array of strings)                                        |
| `contact`  | `introText`                                                                        |
| `general`  | `logoText`, `logoHighlight`, `footerText`                                          |

### Collection: `experience`
| Field         | Type      | Description                          |
|---------------|-----------|--------------------------------------|
| `company`     | string    | Company name                         |
| `role`        | string    | Job title                            |
| `period`      | string    | Employment period                    |
| `description` | string    | Responsibilities (newline-separated) |
| `createdAt`   | timestamp | Auto-generated                       |

### Collection: `projects`
| Field         | Type      | Description                        |
|---------------|-----------|-------------------------------------|
| `title`       | string    | Project name                        |
| `description` | string    | Project description                 |
| `techStack`   | array     | List of technologies used           |
| `imageUrl`    | string    | Project screenshot URL              |
| `githubUrl`   | string    | GitHub repository link              |
| `liveUrl`     | string    | Live demo link                      |
| `createdAt`   | timestamp | Auto-generated                      |

### Collection: `messages`
| Field       | Type      | Description          |
|-------------|-----------|----------------------|
| `name`      | string    | Sender name          |
| `email`     | string    | Sender email         |
| `message`   | string    | Message content      |
| `createdAt` | timestamp | Auto-generated       |

---

## 🌐 Deployment

### Deploy to GitHub Pages

```bash
# Build and deploy in one command
npm run deploy
```

This runs `vite build` and pushes the `dist/` folder to the `gh-pages` branch.

### GitHub Settings
1. Go to your repository → **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select the `gh-pages` branch

### Custom Configuration
- **`vite.config.js`** — Update `base` if your repo name differs
- **`package.json`** — Update the `homepage` field

---

## 📜 Available Scripts

| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start local dev server (port 5173)       |
| `npm run build`   | Build for production to `dist/`          |
| `npm run preview` | Preview production build locally         |
| `npm run deploy`  | Build + deploy to GitHub Pages           |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by **Kem Phearum**
