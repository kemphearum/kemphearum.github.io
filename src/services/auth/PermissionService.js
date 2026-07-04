import { isActionAllowed } from '../../utils/permissions';
import { ACTIONS } from '../../utils/permissionConstants';
import { MODULES } from '../../registry/permissionRegistry';

/**
 * Enterprise PermissionService.
 * Centralizes all permission checks into a unified interface.
 */
class PermissionService {
    /**
     * Determine if a user can perform an action on a resource.
     * @param {Object|string} userOrRole - The user object containing a role, or a role string.
     * @param {string} action - The action to perform (e.g., 'view', 'edit', 'delete').
     * @param {string} resource - The module or resource (e.g., 'dashboard', 'projects').
     * @param {Object} [rolePermissions={}] - Dynamic role configuration from Firestore.
     * @returns {boolean} Whether the action is allowed.
     */
    static can(userOrRole, action, resource, rolePermissions = {}) {
        const role = typeof userOrRole === 'object' && userOrRole !== null ? userOrRole.role : userOrRole;
        if (!role) return false;
        
        return isActionAllowed(action, resource, role, rolePermissions);
    }

    /**
     * Expose constants for easier imports
     */
    static get ACTIONS() {
        return ACTIONS;
    }

    static get RESOURCES() {
        return MODULES;
    }
}

export default PermissionService;
