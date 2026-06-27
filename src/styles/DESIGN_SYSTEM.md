# Design System

Single reference for the portfolio's design tokens and reusable UI primitives.
Reuse these instead of hardcoding values or rebuilding components. The system is
zero-dependency (SCSS tokens + React components already in the repo).

## Tokens — `src/styles/variables.scss`

All tokens are SCSS variables; theme-dependent values resolve to CSS custom
properties (`var(--...)`) set per theme in `global.scss` so light/dark stay in sync.

| Group | Tokens |
|---|---|
| **Color** | `$primary-color`, `$primary-light`, `$primary-dark`, `$secondary-color`, `$accent-color`; theme vars `--text-primary`, `--text-secondary`, `--bg-color`, `--heading-color`, `--glass-surface`, `--glass-border` |
| **Typography** | `$font-family`; sizes `$font-size-xs … $font-size-4xl`; weights `$font-weight-normal/medium/semibold/bold` |
| **Spacing** | `$space-1 … $space-8` (4px base: 4/8/12/16/24/32/48) |
| **Radius** | `$border-radius` (12px) |
| **Shadows** | `$shadow-sm/md/lg`, `$neon-glow` |
| **Motion** | durations `$motion-fast/base/slow`; easings `$ease-standard/$ease-emphasized`; `$transition`, `$transition-fast`, `$transition-slow` |
| **Z-index** | `$z-base/sticky/dropdown/overlay/modal/toast` — the single source of truth for stacking order |
| **Layout** | `$nav-height`, `$container-width` |

Mixins: `@include container`, `@include glass`, `@include section-padding`,
`@include wow-hover`.

**Rule:** new styles use tokens — no magic numbers for spacing, radius, z-index,
or motion. Respect `@media (prefers-reduced-motion: reduce)` for animations.

## UI primitives — `src/shared/components/ui`

Import from the barrel: `import { Button, Card, Badge } from '@/shared/components/ui'`.

| Component | Use |
|---|---|
| `Button` | actions; `variant` (primary/secondary/ghost/danger), `size`, `isLoading` |
| `Card` | surface container; `variant` |
| `Badge` | status / tag pills; `variant` (default/success/warning/primary/danger) |
| `Input`, `TextArea`, `Select` | form controls |
| `Dialog` | modal (Header/Body/Footer/Title/Description/Close) |
| `Dropdown`, `Tooltip`, `Tabs` | interactive |
| `DataTable` | admin tables (sorting, pagination, selection, CSV, mobile cards) |
| `EmptyState` | "no data" states |
| `Skeleton`, `Spinner` | loading |
| `SectionHeader` | public-section header (eyebrow + animated title + subtitle); `align` |
| `HighlightText` | search-match highlighting |

Admin-specific shared pieces live in `src/pages/admin/components` (`StatCard`,
`StatusBadge`, `BulkActionsBar`, `NotificationCenter`, …).

## Theming

`ThemeContext` toggles `data-theme`. Components must read theme via CSS custom
properties (never hardcode hex for text/surface). Keep WCAG 2.2 AA contrast:
body text on background ≥ 4.5:1, large text/UI ≥ 3:1. Interactive elements expose
a visible `:focus-visible` outline.

## Conventions

- Public sections: wrap content in `@include container`, lead with `SectionHeader`,
  gate optional sections with `useFeatureFlag`, and filter content with
  `filterPublished` (see `domain/shared/contentStatus.js`).
- Prefer extending an existing primitive over a new component. New primitives go
  under `src/shared/components/ui/<name>/` and are exported from `index.js`.
