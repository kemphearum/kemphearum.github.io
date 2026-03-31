export const ACTIONS = {
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
    DATABASE_ACTIONS: 'database_actions',
    DISABLE: 'disable'
};

export const MODULES = {
    BLOG: 'blog',
    PROJECTS: 'projects',
    EXPERIENCE: 'experience',
    USERS: 'users',
    DATABASE: 'database',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
    GENERAL: 'general',
    HOME: 'home',
    ABOUT: 'about',
    CONTACT: 'contact',
    MESSAGES: 'messages',
    PROFILE: 'profile',
    AUDIT: 'audit'
};

const VALID_MODULE_KEYS = new Set(Object.values(MODULES));
const VALID_ACTION_KEYS = new Set(Object.values(ACTIONS));

const ROLE_ALIAS_MAP = {
    owner: 'superadmin',
    super_admin: 'superadmin',
    'super-admin': 'superadmin',
    'super admin': 'superadmin',
    superadministrator: 'superadmin',
    administrator: 'admin',
    writer: 'editor'
};

export const normalizeRole = (role) => {
    if (typeof role !== 'string') return '';
    const raw = role.trim();
    if (!raw) return '';

    const lowered = raw.toLowerCase();
    if (ROLE_ALIAS_MAP[lowered]) return ROLE_ALIAS_MAP[lowered];
    return lowered;
};

export const formatRoleDisplayName = (role) => {
    const normalized = normalizeRole(role);
    if (!normalized) return '';

    return normalized
        .split(/[_\-\s]+/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

export const isSuperAdminRole = (role) => normalizeRole(role) === 'superadmin';
export const isAdminRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'superadmin';
};
export const isEditorRole = (role) => {
    const normalized = normalizeRole(role);
    return normalized === 'editor' || normalized === 'admin' || normalized === 'superadmin';
};
export const isPendingRole = (role) => normalizeRole(role) === 'pending';

const DEFAULT_ROLE_BASE = {
    superadmin: 'admin',
    admin: 'admin',
    editor: 'editor',
    pending: 'pending'
};

export const normalizeRolePermissionEntry = (entry, role) => {
    const normalizedRole = normalizeRole(role);
    const fallbackBase = DEFAULT_ROLE_BASE[normalizedRole] || 'pending';
    const normalizeAllowedTabs = (tabs) => Array.from(new Set(
        (Array.isArray(tabs) ? tabs : [])
            .map((tab) => (typeof tab === 'string' ? tab.trim().toLowerCase() : ''))
            .filter((tab) => VALID_MODULE_KEYS.has(tab))
    ));
    const normalizeAllowedActions = (actionsByModule) => {
        if (!actionsByModule || typeof actionsByModule !== 'object') return {};
        return Object.entries(actionsByModule).reduce((acc, [moduleKey, actionList]) => {
            const normalizedModule = typeof moduleKey === 'string' ? moduleKey.trim().toLowerCase() : '';
            if (!VALID_MODULE_KEYS.has(normalizedModule)) return acc;
            const normalizedActions = Array.from(new Set(
                (Array.isArray(actionList) ? actionList : [])
                    .map((action) => (typeof action === 'string' ? action.trim().toLowerCase() : ''))
                    .filter((action) => VALID_ACTION_KEYS.has(action))
            ));
            acc[normalizedModule] = normalizedActions;
            return acc;
        }, {});
    };

    if (Array.isArray(entry)) {
        return {
            baseRole: fallbackBase,
            allowedTabs: normalizeAllowedTabs(entry),
            allowedActions: {}
        };
    }

    if (entry && typeof entry === 'object') {
        const normalizedBaseRole = normalizeRole(entry.baseRole);
        return {
            baseRole: ['admin', 'editor', 'pending'].includes(normalizedBaseRole)
                ? normalizedBaseRole
                : fallbackBase,
            allowedTabs: normalizeAllowedTabs(entry.allowedTabs),
            allowedActions: normalizeAllowedActions(entry.allowedActions)
        };
    }

    return {
        baseRole: fallbackBase,
        allowedTabs: [],
        allowedActions: {}
    };
};

const isDefaultRoleCapabilityAllowed = (action, moduleName, normalizedRole) => {
    if (normalizedRole === 'admin') {
        const restrictedAdminModules = [MODULES.USERS, MODULES.AUDIT, MODULES.SETTINGS];
        if (restrictedAdminModules.includes(moduleName)) return false;
        // Admins can do anything that isn't SuperAdmin-only, except full DB destructive actions
        if (moduleName === MODULES.DATABASE && action === ACTIONS.DATABASE_ACTIONS) return false;
        return true;
    }

    if (normalizedRole === 'editor') {
        // Editors are restricted from Admin/SuperAdmin data layers
        const adminModules = [MODULES.DATABASE, MODULES.EXPERIENCE, MODULES.MESSAGES, MODULES.GENERAL];
        if (adminModules.includes(moduleName)) return false;

        // Editors cannot delete anything or perform low-level DB operations
        if (action === ACTIONS.DELETE) return false;
        if (action === ACTIONS.DATABASE_ACTIONS) return false;

        // Default modules allowed for editor
        return [MODULES.BLOG, MODULES.PROJECTS].includes(moduleName);
    }

    if (normalizedRole === 'pending') {
        // Pending users only have profile access (handled above)
        return false;
    }

    return false;
};

/**
 * Core RBAC decision engine.
 * Consolidates all permission logic for the application.
 */
export const isActionAllowed = (action, moduleName, role, rolePermissions = {}) => {
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) return false;

    // 1. Superadmin has absolute power
    if (isSuperAdminRole(normalizedRole)) return true;

    // 2. These modules are strictly for superadmin (unless it's self-reading profile)
    const superAdminOnly = [MODULES.AUDIT];
    if (superAdminOnly.includes(moduleName) && moduleName !== MODULES.PROFILE) {
        return false;
    }

    // Settings can be visible by dynamic role tab config, but only superadmin can mutate.
    if (moduleName === MODULES.SETTINGS && action !== ACTIONS.VIEW) {
        return false;
    }

    // 3. Always allow profile access for any authenticated role
    if (moduleName === MODULES.PROFILE) return true;

    // 4. Handle dynamic configuration (Strict Priority)
    // If a role is explicitly defined in the rolePermissions object, that configuration defines their world.
    const isRoleConfigured = rolePermissions && Object.prototype.hasOwnProperty.call(rolePermissions, normalizedRole);

    if (isRoleConfigured) {
        const permissionEntry = normalizeRolePermissionEntry(rolePermissions[normalizedRole], normalizedRole);
        const configuredTabs = Array.isArray(permissionEntry.allowedTabs) ? permissionEntry.allowedTabs : [];
        const configuredActions = permissionEntry.allowedActions && typeof permissionEntry.allowedActions === 'object'
            ? permissionEntry.allowedActions
            : {};

        const isTabInConfig = configuredTabs.includes(moduleName);

        // If it's a VIEW request, return whether it's in the config
        if (action === ACTIONS.VIEW) return isTabInConfig;

        // If it's any other action, and they can't VIEW it, they can't do anything
        if (!isTabInConfig) return false;

        const explicitActionsForModule = Array.isArray(configuredActions[moduleName])
            ? configuredActions[moduleName]
            : [];
        
        // 1. Explicitly granted actions always win
        if (explicitActionsForModule.includes(action)) return true;

        // 2. Fallback to inheritance from base role
        const capabilityRole = ['admin', 'editor', 'pending'].includes(normalizedRole)
            ? normalizedRole
            : permissionEntry.baseRole;

        // Honor the base role capabilities, overriding default module restrictions,
        // because the user explicitly granted the module in 'configuredTabs'.
        if (capabilityRole === 'superadmin') return true;
        
        if (capabilityRole === 'admin') {
            // Admins can do anything that isn't SuperAdmin-only,
            // except full DB destructive actions
            if (moduleName === MODULES.DATABASE && action === ACTIONS.DATABASE_ACTIONS) return false;
            return true;
        }

        if (capabilityRole === 'editor') {
            // Editors cannot delete anything or perform low-level DB operations
            if (action === ACTIONS.DELETE) return false;
            if (action === ACTIONS.DATABASE_ACTIONS) return false;
            return true;
        }

        return false;
    }

    // 5. Default Role Matrices (Fallback logic if no specific config exists)
    // Only applied if we don't have a dynamic config for the role.
    return isDefaultRoleCapabilityAllowed(action, moduleName, normalizedRole);
};
