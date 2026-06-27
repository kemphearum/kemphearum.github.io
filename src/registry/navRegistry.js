import {
    LayoutDashboard, Home, MessageSquare, Database as DatabaseIcon,
    Users as UsersIcon, ScrollText, BarChart2, Settings as SettingsIcon, User as UserIcon
} from 'lucide-react';
import { getContentType } from './contentTypeRegistry';

/**
 * Non-content (special) tabs. Items listed in NAV_GROUPS appear in the sidebar;
 * the rest (settings, profile) are still resolvable for the command palette and
 * other registry consumers. Content-type nav items resolve from the content-type
 * registry instead, so the two stay in sync.
 */
const SPECIAL_ITEMS = {
    dashboard: { labelKey: 'admin.tabs.dashboard', icon: LayoutDashboard },
    general: { labelKey: 'admin.tabs.general', icon: Home },
    messages: { labelKey: 'admin.tabs.messages', icon: MessageSquare, badgeKey: 'unreadMessagesCount' },
    database: { labelKey: 'admin.tabs.database', icon: DatabaseIcon },
    users: { labelKey: 'admin.tabs.users', icon: UsersIcon },
    audit: { labelKey: 'admin.tabs.audit', icon: ScrollText },
    analytics: { labelKey: 'admin.tabs.analytics', icon: BarChart2 },
    settings: { labelKey: 'admin.tabs.settings', icon: SettingsIcon },
    profile: { labelKey: 'admin.tabs.profile', icon: UserIcon }
};

/**
 * All navigable tab keys (sidebar groups + the non-sidebar special tabs).
 * Used by the command palette to offer "jump to" navigation commands.
 */
export const getNavigableKeys = () => {
    const grouped = NAV_GROUPS.flatMap((group) => group.keys);
    const extras = ['settings', 'profile'];
    return Array.from(new Set([...grouped, ...extras]));
};

/**
 * Ordered sidebar layout. Content-type keys resolve via the content registry, so
 * a new content type appears by adding its key to the right group + registering
 * its descriptor.
 */
export const NAV_GROUPS = [
    { id: 'main', titleKey: 'admin.sidebar.groups.main', keys: ['dashboard', 'general', 'experience', 'projects', 'skills', 'certificates'] },
    { id: 'management', titleKey: 'admin.sidebar.groups.management', keys: ['blog', 'messages', 'database'] },
    { id: 'system', titleKey: 'admin.sidebar.groups.system', keys: ['users', 'audit', 'analytics'] }
];

export const getNavItem = (key) => {
    if (SPECIAL_ITEMS[key]) return { key, badgeKey: null, ...SPECIAL_ITEMS[key] };
    const contentType = getContentType(key);
    if (contentType) {
        return { key, labelKey: contentType.labelKey, icon: contentType.icon, badgeKey: null };
    }
    return null;
};
