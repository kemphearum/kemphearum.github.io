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

export const isActionAllowed = (action, moduleName, role, rolePermissions = {}) => {
    if (!role) return false;
    
    // Superadmin and Admin have systemic defaults (admin can be restricted later via config if desired)
    if (role === 'superadmin' || role === 'admin') {
        // Admin default full override for now unless overridden by complex DB structures
        return true;
    }
    
    // Editor explicit matrix
    if (role === 'editor') {
        if (action === ACTIONS.DELETE) return false;
        if (action === ACTIONS.DATABASE_ACTIONS) return false;
        if ([MODULES.USERS, MODULES.DATABASE, MODULES.AUDIT, MODULES.SETTINGS].includes(moduleName)) return false;
        return true; 
    }
    
    // Pending limits
    if (role === 'pending') {
        if (action === ACTIONS.VIEW && moduleName === MODULES.PROFILE) return true;
        return false;
    }
    
    return false;
};
