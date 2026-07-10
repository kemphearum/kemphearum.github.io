# Firebase Integration

## Client Integration

`src/firebase.js` initializes Firebase client behavior. Firestore client access should go through services, not components.

## Server Integration

`src/server/firebaseAdmin.js` provides server-only Firebase Admin access for API route modules that need token verification or privileged server behavior.

## Rules and Indexes

`firestore.rules` and `firestore.indexes.json` must be updated with any new collection, compound query, or protected write path.

## Constraint

Keep Firebase usage Spark-compatible unless a future decision explicitly changes the zero-cost constraint.

