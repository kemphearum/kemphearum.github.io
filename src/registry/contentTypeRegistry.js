import { listFeatures } from './featureRegistry';

/**
 * Central registry of CMS content types, now derived from the Feature Registry.
 *
 * Sidebar navigation, admin routing, the command-palette search, and dashboard
 * counts all derive from these descriptors.
 */
export const CONTENT_TYPES = listFeatures()
    .filter((f) => f.contentType)
    .map((f) => ({
        key: f.id,
        module: f.id,
        navGroup: f.nav?.group || 'main',
        labelKey: f.nav?.labelKey,
        subtitleKey: f.contentType.subtitleKey,
        icon: f.nav?.icon,
        statusCapable: f.contentType.statusCapable || false,
        load: f.contentType.load
    }));

const byKey = Object.fromEntries(CONTENT_TYPES.map((type) => [type.key, type]));

export const listContentTypes = () => CONTENT_TYPES;
export const getContentType = (key) => byKey[key] || null;
export const isContentType = (key) => Boolean(byKey[key]);
