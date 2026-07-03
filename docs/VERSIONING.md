# Versioning Strategy

This project adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/).

Given a version number `MAJOR.MINOR.PATCH`, we increment the:

1. **MAJOR** version when we make incompatible API changes or significant architectural overhauls.
2. **MINOR** version when we add functionality in a backward-compatible manner (e.g., new CMS features, new public sections).
3. **PATCH** version when we make backward-compatible bug fixes or security patches.

## Release Process

When preparing for a release:

1. **Update `CHANGELOG.md`:** Move the `Unreleased` changes into a new version block matching the upcoming tag.
2. **Update `package.json`:** Bump the version number using `npm version <major|minor|patch>`.
3. **Commit:** Commit the changes with the message `chore: release vX.Y.Z`.
4. **Tag:** Tag the commit with `vX.Y.Z` (this is done automatically if using `npm version`).
5. **Push:** Push the commit and the tags to the remote repository (`git push --follow-tags`).
6. **Automation:** The GitHub Action `.github/workflows/release.yml` will automatically detect the new tag and generate a GitHub Release utilizing the changelog notes.
