# Deployment Architecture

## Primary Hosting

Vercel is the primary deployment target for SSR, API routes, analytics, and speed insights.

## Static Mirrors

Firebase Hosting and GitHub Pages are listed as static mirrors in `README.md`.

## Build Flow

`npm run build` runs `react-router build` and `scripts/flatten-prerender.mjs`. Firebase rules are deployed with `npm run deploy:firebase:rules`.

## Constraint

Keep the deployment compatible with Vercel Hobby, Firebase Spark, and GitHub Free.

