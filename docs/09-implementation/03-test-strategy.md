# Test Strategy

## Current Verification

Use lint, build, route checks, browser verification, Firestore rules review, admin signed-in checks, public signed-out checks, and SEO/feed checks according to the change type.

## Future Tests

Add Firestore rules tests if `firestore.rules.test.mjs` is introduced. Add route or component tests where high-value workflows become stable enough to justify regression coverage.

## Documentation Changes

No lint is required for docs-only changes unless source files are changed.

