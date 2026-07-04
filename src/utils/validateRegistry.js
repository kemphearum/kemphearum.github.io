import { listFeatures } from '../registry/featureRegistry';
import { ACTIONS } from './permissionConstants';

export const validateFeatureRegistry = () => {
    if (!import.meta.env.DEV) return; // Only run in development

    const features = listFeatures();
    const seenIds = new Set();
    const validActions = new Set(Object.values(ACTIONS));
    const errors = [];

    features.forEach(feature => {
        // 1. Check for missing or duplicate IDs
        if (!feature.id) {
            errors.push(`Feature is missing an 'id'.`);
        } else if (seenIds.has(feature.id)) {
            errors.push(`Duplicate Feature ID found: '${feature.id}'.`);
        } else {
            seenIds.add(feature.id);
        }

        // 2. Validate Navigation Metadata
        if (!feature.nav || !feature.nav.labelKey) {
            errors.push(`Feature '${feature.id || 'unknown'}' is missing nav.labelKey.`);
        }

        // 3. Validate Permissions
        if (!feature.permissions) {
            errors.push(`Feature '${feature.id}' is missing a permissions block.`);
        } else {
            // Check supported actions
            if (!Array.isArray(feature.permissions.supportedActions)) {
                errors.push(`Feature '${feature.id}' has invalid supportedActions (must be an array).`);
            } else {
                feature.permissions.supportedActions.forEach(action => {
                    if (!validActions.has(action)) {
                        errors.push(`Feature '${feature.id}' uses an invalid supportedAction: '${action}'. Ensure it is defined in ACTIONS.`);
                    }
                });
            }

            // Check default permissions
            if (feature.permissions.defaultPermissions) {
                Object.entries(feature.permissions.defaultPermissions).forEach(([role, actions]) => {
                    if (!Array.isArray(actions)) {
                        errors.push(`Feature '${feature.id}' defaultPermissions for role '${role}' must be an array.`);
                    } else {
                        actions.forEach(action => {
                            if (!validActions.has(action)) {
                                errors.push(`Feature '${feature.id}' defaultPermissions for role '${role}' contains invalid action: '${action}'.`);
                            }
                            if (feature.permissions.supportedActions && !feature.permissions.supportedActions.includes(action)) {
                                errors.push(`Feature '${feature.id}' defaultPermissions for role '${role}' contains action '${action}', but it is not listed in supportedActions.`);
                            }
                        });
                    }
                });
            }
        }
    });

    if (errors.length > 0) {
        console.groupCollapsed(`%c🚨 Feature Registry Validation Failed (${errors.length} errors)`, 'color: red; font-weight: bold');
        errors.forEach(err => console.error(err));
        console.groupEnd();
    } else {
        console.log(`%c✅ Feature Registry Validation Passed (${features.length} features)`, 'color: green; font-weight: bold');
    }
};
