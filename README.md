# Developer Portfolio with React & Firebase

A modern, responsive developer portfolio application built with React, Firebase, and SCSS. This project includes a public-facing portfolio and a private admin dashboard to manage your projects.

## Features

- **Public Portfolio**: Home, About, Projects (dynamic), Contact form.
- **Admin Dashboard**: Secure login (Firebase Auth), Add new projects (image upload + Firestore).
- **Tech Stack**: React (Vite), Firebase (Firestore, storage, Auth), SCSS Modules.
- **Deployment**: Ready for GitHub Pages.

## Prerequisites

- Node.js installed.
- A GitHub account.
- A Google/Firebase account.

## Installation

1.  **Clone/Open the repository**:
    ```bash
    cd portfolio
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Firebase Setup

1.  **Create a Project**:
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Click "Add project" and follow the steps.

2.  **Enable Authentication**:
    - Go to **Build > Authentication**.
    - Click "Get started".
    - Enable **Email/Password** provider.
    - Go to **Users** tab and "Add user" (this will be your admin account).

3.  **Enable Firestore Database**:
    - Go to **Build > Firestore Database**.
    - Click "Create database".
    - Start in **Test mode** (for development) or **Production mode**.
    - If in Production, update Rules to allow read for everyone, write for auth users:
      ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /projects/{project} {
            allow read: if true;
            allow write: if request.auth != null;
          }
          match /messages/{message} {
            allow create: if true;
            allow read, update, delete: if request.auth != null;
          }
        }
      }
      ```

4.  **Enable Storage**:
    - Go to **Build > Storage**.
    - Click "Get started".
    - set rules similar to Firestore (read public, write auth).

5.  **Get Configuration**:
    - Go to **Project settings** (gear icon).
    - Scroll to "Your apps" > "Web app".
    - Register app (e.g., "My Portfolio").
    - Copy the `firebaseConfig` object.

6.  **Update Config Files**:
    - Open `src/firebase.js`.
    - Paste your config values into the `firebaseConfig` variable.

## Deployment to GitHub Pages

1.  **Update Configuration**:
    - In `vite.config.js`, change `base: '/portfolio/'` to your actual repository name (e.g., `base: '/my-repo/'`).
    - In `package.json`, update `"homepage"`: `"https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>"`.

2.  **Build and Deploy**:
    ```bash
    npm run deploy
    ```
    - This command builds the app to `dist/` and pushes it to the `gh-pages` branch.

3.  **GitHub Settings**:
    - Go to your repository on GitHub.
    - Go to **Settings > Pages**.
    - Ensure source is set to `gh-pages` branch.

## Firestore Data Structure

- **Collection: `projects`**
  - `title` (string): Project title.
  - `description` (description): Short description.
  - `techStack` (array): List of technologies.
  - `imageUrl` (string): URL from Firebase Storage.
  - `githubUrl` (string): Link to code.
  - `liveUrl` (string): Link to demo.
  - `createdAt` (timestamp).

- **Collection: `messages`**
  - `name` (string).
  - `email` (string).
  - `message` (string).
  - `createdAt` (timestamp).
