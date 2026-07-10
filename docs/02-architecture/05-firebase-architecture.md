# Firebase Architecture

## Firebase Services

The app uses Firebase Authentication and Firestore on the Spark plan. Client access goes through Firebase Web SDK services; server API routes use server-only Firebase Admin helpers.

## Security Boundary

`firestore.rules` is the final data authorization boundary. UI permission checks and admin navigation gating improve UX but are not the enforcement source.

## Indexes

`firestore.indexes.json` defines indexes for posts, projects, logs, audit logs, experience, messages, skills, certificates, education, awards, publications, and speaking.

