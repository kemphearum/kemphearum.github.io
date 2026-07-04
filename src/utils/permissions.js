import { getFeature } from '../registry/featureRegistry.js';
import { ACTIONS } from './permissionConstants';
import { MODULES, MODULE_ACTIONS } from '../registry/permissionRegistry';

export { ACTIONS };
export { MODULES, MODULE_ACTIONS };

const VALID_MODULE_KEYS = new Set(Object.values(MODULES));
const VALID_ACTION_KEYS = new Set(Object.values(ACTIONS));

export const ACTION_DEPENDENCIES = {
    [ACTIONS.CREATE]: [ACTIONS.VIEW],
    [ACTIONS.EDIT]: [ACTIONS.VIEW],
    [ACTIONS.DELETE]: [ACTIONS.VIEW],
    [ACTIONS.PUBLISH]: [ACTIONS.VIEW, ACTIONS.EDIT],
    [ACTIONS.ARCHIVE]: [ACTIONS.VIEW],
    [ACTIONS.VIEW_HISTORY]: [ACTIONS.VIEW],
};

export const enforceDependencies = (actions) => {
    if (!Array.isArray(actions)) return [];
    const enforced = new Set(actions);
    let changed = true;
    
    // Iteratively resolve dependencies
    while (changed) {
        changed = false;
        for (const action of enforced) {
            const deps = ACTION_DEPENDENCIES[action] || [];
            for (const dep of deps) {
                if (!enforced.has(dep)) {
                    enforced.add(dep);
                    changed = true;
                }
            }
        }
    }
    return Array.from(enforced);
};

export const SOD_CONFLICTS = [
    // Example: A user cannot possess both standard data entry and raw database manipulation
    [ACTIONS.CREATE, ACTIONS.DATABASE_ACTIONS]
];

export const validateSoD = (actions) => {
    for (const conflict of SOD_CONFLICTS) {
        const hasAll = conflict.every(a => actions.includes(a));
        if (hasAll) {
            return `SoD Violation: Cannot combine ${conflict.join(' and ')}`;
        }
    }
    return null;
};


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

// Actions an `editor` (and editor-based custom roles) may perform on the
// content modules they can access. Editors author content but cannot delete,
// feature, toggle visibility, or run database operations — those stay with
// admins. Used by BOTH the default matrix and the base-role inheritance branch
// so the two paths agree.
const EDITOR_ALLOWED_ACTIONS = new Set([
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.VIEW_HISTORY
]);

/* const isDefaultRoleCapabilityAllowed = (action, moduleName, normalizedRole) => {
    if (normalizedRole === 'admin') {
        const restrictedAdminModules = [MODULES.USERS, MODULES.AUDIT, MODULES.SETTINGS];
        if (restrictedAdminModules.includes(moduleName)) return false;
        // Admins can do anything that isn't SuperAdmin-only, except full DB destructive actions
        if (moduleName === MODULES.DATABASE && action === ACTIONS.DATABASE_ACTIONS) return false;
        return true;
    }

    if (normalizedRole === 'editor') {
        // Editors are restricted from Admin/SuperAdmin data layers
        const adminModules = [MODULES.DATABASE, MODULES.EXPERIENCE, MODULES.EDUCATION, MODULES.MESSAGES, MODULES.GENERAL, MODULES.RESUME];
        if (adminModules.includes(moduleName)) return false;

        // Editors are excluded from low-level DB operations
        if (action === ACTIONS.DATABASE_ACTIONS) return false;

        // Default modules allowed for editor — content authoring actions only.
        if (![MODULES.BLOG, MODULES.PROJECTS, MODULES.SKILLS, MODULES.CERTIFICATES, MODULES.COMMUNICATION].includes(moduleName)) return false;
        return EDITOR_ALLOWED_ACTIONS.has(action);
    }

    if (normalizedRole === 'pending') {
        // Pending users only have profile access (handled above)
        return false;
    }

    return false;
}; */

/**
 * Core RBAC decision engine.
 * Consolidates all permission logic for the application.
 */
export const isActionAllowed = (action, moduleName, role, rolePermissions = {}) => {
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole || normalizedRole === 'pending') return false;

    // 1. Superadmin has absolute power
    if (isSuperAdminRole(normalizedRole)) return true;

    // 2. Dynamic configuration (role matrix overrides)
    const isRoleConfigured = rolePermissions && Object.prototype.hasOwnProperty.call(rolePermissions, normalizedRole);
    if (isRoleConfigured) {
        const permissionEntry = normalizeRolePermissionEntry(rolePermissions[normalizedRole], normalizedRole);
        const configuredTabs = Array.isArray(permissionEntry.allowedTabs) ? permissionEntry.allowedTabs : [];
        const configuredActions = permissionEntry.allowedActions && typeof permissionEntry.allowedActions === 'object'
            ? permissionEntry.allowedActions
            : {};

        const isTabInConfig = configuredTabs.includes(moduleName);
        if (action === ACTIONS.VIEW) return isTabInConfig;
        if (!isTabInConfig) return false;

        const explicitActionsForModule = Array.isArray(configuredActions[moduleName]) ? configuredActions[moduleName] : [];
        if (explicitActionsForModule.includes(action)) return true;

        const capabilityRole = ['admin', 'editor', 'author', 'viewer'].includes(normalizedRole)
            ? normalizedRole
            : permissionEntry.baseRole;
            
        if (capabilityRole === 'superadmin') return true;
        
        const feature = getFeature(moduleName);
        if (!feature || !feature.permissions || !feature.permissions.defaultPermissions) return false;
        
        const defaultActions = feature.permissions.defaultPermissions[capabilityRole] || [];
        return defaultActions.includes(action);
    }

    // 3. Fallback to Feature Registry Default Permissions
    const feature = getFeature(moduleName);
    if (!feature || !feature.permissions || !feature.permissions.defaultPermissions) return false;

    const defaultActions = feature.permissions.defaultPermissions[normalizedRole] || [];
    return defaultActions.includes(action);
};
