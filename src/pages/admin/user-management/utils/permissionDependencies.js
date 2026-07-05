import { ACTIONS } from '../../../../utils/permissions';

// Define dependency graph for permissions
// Format: { [action]: { requires: [required_actions], recommends: [recommended_actions] } }
export const PERMISSION_DEPENDENCIES = {
    [ACTIONS.DELETE]: {
        requires: [ACTIONS.VIEW],
        recommends: [ACTIONS.EDIT]
    },
    [ACTIONS.EDIT]: {
        requires: [ACTIONS.VIEW],
        recommends: []
    },
    [ACTIONS.CREATE]: {
        requires: [ACTIONS.VIEW],
        recommends: []
    },
    [ACTIONS.PUBLISH]: {
        requires: [ACTIONS.VIEW],
        recommends: [ACTIONS.EDIT]
    },
    [ACTIONS.ARCHIVE]: {
        requires: [ACTIONS.VIEW],
        recommends: [ACTIONS.EDIT]
    }
};

/**
 * Checks a specific permission change against dependencies.
 * Phase 1: Returns warnings to be displayed.
 * 
 * @param {string} action - The action being toggled
 * @param {boolean} isGranted - Whether it is being granted or revoked
 * @param {Array<string>} currentActions - Currently granted actions for this feature
 * @param {boolean} hasViewAccess - Whether the feature currently has view access
 * @returns {Array<string>} - Array of warning messages, or empty if none.
 */
export const checkDependencies = (action, isGranted, currentActions, hasViewAccess) => {
    const warnings = [];
    const deps = PERMISSION_DEPENDENCIES[action];
    
    if (!deps) return warnings;

    if (isGranted) {
        // If granting, check what it requires
        if (deps.requires) {
            deps.requires.forEach(req => {
                if (req === ACTIONS.VIEW && !hasViewAccess) {
                    warnings.push(`Granting '${action}' automatically requires '${req}'.`);
                } else if (req !== ACTIONS.VIEW && !currentActions.includes(req)) {
                    warnings.push(`Granting '${action}' requires '${req}'.`);
                }
            });
        }
        
        // Check recommendations
        if (deps.recommends) {
            deps.recommends.forEach(rec => {
                if (rec === ACTIONS.VIEW && !hasViewAccess) {
                    warnings.push(`It is recommended to also grant '${rec}' when granting '${action}'.`);
                } else if (rec !== ACTIONS.VIEW && !currentActions.includes(rec)) {
                    warnings.push(`It is recommended to also grant '${rec}' when granting '${action}'.`);
                }
            });
        }
    } else {
        // If revoking, check if anything else requires this action
        Object.entries(PERMISSION_DEPENDENCIES).forEach(([dependentAction, rules]) => {
            if (rules.requires && rules.requires.includes(action)) {
                if (currentActions.includes(dependentAction)) {
                    warnings.push(`Revoking '${action}' will also affect '${dependentAction}' which requires it.`);
                }
            }
        });
    }

    return warnings;
};
