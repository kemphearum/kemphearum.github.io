# Registry System

## Registries

- `featureRegistry.js`
- `contentTypeRegistry.js`
- `navRegistry.js`
- `permissionRegistry.js`
- `searchRegistry.js`
- `settingsRegistry.js`
- `dashboardWidgetRegistry.js`

## Purpose

Registries turn admin modules into descriptors for navigation, permissions, search, settings, dashboard widgets, and content-type behavior.

## Rule

Prefer adding or updating descriptors over scattering one-off wiring across admin files.

