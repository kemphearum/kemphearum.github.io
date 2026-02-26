---
description: How to style components for light/dark mode compatibility
---

# Styling Rules for Theme Compatibility

## ❌ NEVER use these in `.module.scss` files:

- `$text-primary` → use `var(--text-primary)` instead
- `$text-secondary` → use `var(--text-secondary)` instead
- `$background-color` → use `var(--bg-color)` instead (except in top-level page backgrounds)
- `rgba(255, 255, 255, 0.xx)` → use a CSS variable from the table below
- Hardcoded hex colors for text like `#f0f0f5`, `#a0a0b0` → use CSS variables

## ✅ CSS Variable Reference

| Purpose | CSS Variable |
|---|---|
| Primary text | `var(--text-primary)` |
| Secondary text | `var(--text-secondary)` |
| Card backgrounds | `var(--card-bg)` |
| Card hover state | `var(--card-hover)` |
| Glass surface | `var(--glass-surface)` |
| Glass border | `var(--glass-border)` |
| Input background | `var(--input-bg)` |
| Input border | `var(--input-border)` |
| Input focus bg | `var(--input-focus-bg)` |
| Heading color | `var(--heading-color)` |
| Skeleton shimmer | `var(--skeleton-base)` / `var(--skeleton-shine)` |
| Dividers/separators | `var(--divider)` |
| Backdrop overlay | `var(--backdrop-bg)` |
| Surface overlay | `var(--bg-surface)` |

## ✅ SCSS variables that ARE safe to use (they're brand colors, not theme-dependent):

- `$primary-color` — the brand purple
- `$secondary-color` — the brand pink
- `rgba($primary-color, 0.xx)` — alpha variants of brand colors

## Adding a new CSS variable

If you need a new themed value:
1. Add it to `:root` in `src/styles/global.scss` (dark mode value)
2. Add the matching override in `[data-theme="light"]` (light mode value)
3. Use `var(--your-new-variable)` in your SCSS
