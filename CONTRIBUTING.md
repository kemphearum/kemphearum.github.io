# Contributing Guidelines

Thank you for your interest in contributing! This project is primarily a personal portfolio and administrative dashboard. While it is closed-source by default (All Rights Reserved), contributions in the form of bug reports, security disclosures, or feature suggestions are welcome via the Issue Tracker.

## Reporting Bugs

Before submitting a bug report, please check the existing issues to ensure it hasn't already been reported.

When reporting a bug, please include:
- A clear and descriptive title.
- Steps to reproduce the behavior.
- Expected behavior vs. actual behavior.
- Screenshots, if applicable.
- Environment details (Browser, OS).

## Requesting Features

Feature requests are welcome! When requesting a new feature, please explain:
- The problem it solves or the value it adds.
- Proposed implementation or design (if applicable).
- Any alternatives considered.

## Development Setup

If you have been granted access to contribute code directly, please follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kemphearum/kemphearum.github.io.git
   cd kemphearum.github.io
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration keys.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Pull Request Process

1. Ensure any changes are thoroughly tested (unit, component, and E2E).
2. Follow the existing code style and naming conventions.
3. Keep pull requests focused on a single issue or feature.
4. Run `npm run lint` and `npm run test` before submitting.
5. Provide a clear description in your Pull Request explaining the changes and their impact.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
