import { getContentType } from './contentTypeRegistry';
import { listFeatures } from './featureRegistry';

/**
 * Non-content (special) tabs. Items listed in NAV_GROUPS appear in the sidebar;
 * the rest (settings, profile) are still resolvable for the command palette and
 * other registry consumers. Content-type nav items resolve from the content-type
 * registry instead, so the two stay in sync.
 */
export const SPECIAL_ITEMS = listFeatures()
    .filter((f) => !f.contentType && f.nav)
    .reduce((acc, f) => {
        acc[f.id] = { labelKey: f.nav.labelKey, icon: f.nav.icon, badgeKey: f.nav.badgeKey || null };
        return acc;
    }, {});

/**
 * Ordered sidebar layout. Content-type keys resolve via the content registry, so
 * a new content type appears by adding its key to the right group + registering
 * its descriptor.
 */
export const NAV_GROUPS = [
    { id: 'main', titleKey: 'admin.sidebar.groups.main', keys: [] },
    { id: 'management', titleKey: 'admin.sidebar.groups.management', keys: [] },
    { id: 'system', titleKey: 'admin.sidebar.groups.system', keys: [] }
];

// Populate NAV_GROUPS based on feature definitions
listFeatures().forEach((feature) => {
    if (feature.nav && feature.nav.group) {
        const group = NAV_GROUPS.find((g) => g.id === feature.nav.group);
        if (group) {
            group.keys.push(feature.id);
        }
    }
});

/**
 * All navigable tab keys (sidebar groups + the non-sidebar special tabs).
 * Used by the command palette to offer "jump to" navigation commands.
 */
export const getNavigableKeys = () => {
    const grouped = NAV_GROUPS.flatMap((group) => group.keys);
    const extras = listFeatures().filter(f => f.nav?.isSpecial).map(f => f.id);
    return Array.from(new Set([...grouped, ...extras]));
};

export const getNavItem = (key) => {
    if (SPECIAL_ITEMS[key]) return { key, badgeKey: null, ...SPECIAL_ITEMS[key] };
    const contentType = getContentType(key);
    if (contentType) {
        return { key, labelKey: contentType.labelKey, icon: contentType.icon, badgeKey: null };
    }
    return null;
};
