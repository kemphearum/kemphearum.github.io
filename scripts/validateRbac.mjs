import { FEATURES } from '../src/registry/featureRegistry.js';
import { ACTIONS } from '../src/utils/permissionConstants.js';

let hasErrors = false;

function logError(message) {
    console.error(`❌ [ERROR] ${message}`);
    hasErrors = true;
}

function logSuccess(message) {
    console.log(`✅ [OK] ${message}`);
}

const VALID_ACTIONS = new Set(Object.values(ACTIONS));
const VALID_CATEGORIES = new Set(['content', 'system', 'analytics', 'communication', 'database']);
const VALID_ROLES = new Set(['superadmin', 'admin', 'editor', 'author', 'viewer', 'pending', 'anonymous']);
const SEEN_IDS = new Set();

console.log('Starting RBAC Validation...\n');

FEATURES.forEach(feature => {
    // 1. Check ID uniqueness
    if (SEEN_IDS.has(feature.id)) {
        logError(`Duplicate feature ID found: ${feature.id}`);
    }
    SEEN_IDS.add(feature.id);

    // 2. Check required fields
    if (!feature.id) logError(`Feature missing ID.`);
    if (feature.category && !VALID_CATEGORIES.has(feature.category)) logError(`Feature ${feature.id} has invalid category: ${feature.category}`);
    if (feature.nav && !feature.nav.labelKey) logError(`Feature ${feature.id} missing labelKey.`);

    // 3. Check actions
    if (!feature.permissions || !Array.isArray(feature.permissions.supportedActions)) {
        logError(`Feature ${feature.id} missing permissions.supportedActions array.`);
    } else {
        feature.permissions.supportedActions.forEach(action => {
            if (!VALID_ACTIONS.has(action)) {
                logError(`Feature ${feature.id} defines unknown action: ${action}`);
            }
        });
    }

    // 4. Check default permissions structure
    if (!feature.permissions || !feature.permissions.defaultPermissions || typeof feature.permissions.defaultPermissions !== 'object') {
        logError(`Feature ${feature.id} missing permissions.defaultPermissions object.`);
    } else {
        Object.keys(feature.permissions.defaultPermissions).forEach(role => {
            if (!VALID_ROLES.has(role)) {
                logError(`Feature ${feature.id} defines permissions for unknown role: ${role}`);
            }
            
            const roleActions = feature.permissions.defaultPermissions[role];
            if (roleActions === true) return; // Special case for superadmin
            if (roleActions === false) return; // Special case for blocked

            if (!Array.isArray(roleActions)) {
                logError(`Feature ${feature.id} has invalid default permissions for role ${role}`);
            } else {
                roleActions.forEach(action => {
                    if (!feature.permissions.supportedActions.includes(action)) {
                        logError(`Feature ${feature.id} grants action ${action} to ${role}, but action is not in supportedActions.`);
                    }
                });
            }
        });
    }
});

if (hasErrors) {
    console.error('\nRBAC Validation FAILED. See errors above.');
    process.exit(1);
} else {
    console.log(`\nAll ${FEATURES.length} features passed RBAC validation.`);
}
