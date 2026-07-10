# Environment Strategy

## Environments

- Local development through `npm run dev`.
- Production SSR/API deployment through Vercel.
- Firebase hosting and GitHub Pages are static mirrors per `README.md`.
- Firestore and Firebase Authentication are the shared data and identity backing services.

## Configuration

Local configuration uses `.env`, `.env.local`, and `.env.example`. Server-only secrets belong in Vercel environment variables, not in client-bundled source.

