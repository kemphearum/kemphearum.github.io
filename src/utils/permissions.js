export const ACTIONS = {
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
    DATABASE_ACTIONS: 'database_actions'
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

export const isActionAllowed = (action, moduleName, role, rolePermissions = {}) => {
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) return false;
    
    // Superadmin and Admin keep full access by design.
    if (isAdminRole(normalizedRole)) {
        return true;
    }

    const configuredTabs = Array.isArray(rolePermissions?.[normalizedRole]) ? rolePermissions[normalizedRole] : null;
    if (action === ACTIONS.VIEW && configuredTabs && configuredTabs.length > 0) {
        return moduleName === MODULES.PROFILE || configuredTabs.includes(moduleName);
    }
    
    // Editor explicit matrix
    if (normalizedRole === 'editor') {
        if (action === ACTIONS.DELETE) return false;
        if (action === ACTIONS.DATABASE_ACTIONS) return false;
        if ([MODULES.USERS, MODULES.DATABASE, MODULES.AUDIT, MODULES.SETTINGS].includes(moduleName)) return false;
        return true; 
    }
    
    // Pending limits
    if (normalizedRole === 'pending') {
        if (action === ACTIONS.VIEW && moduleName === MODULES.PROFILE) return true;
        return false;
    }
    
    return false;
};
