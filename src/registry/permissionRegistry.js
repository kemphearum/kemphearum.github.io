import { listFeatures } from './featureRegistry';

/**
 * Derives MODULES and MODULE_ACTIONS dynamically from registered features.
 */

// Dynamically build MODULES enum from registered features
export const MODULES = listFeatures().reduce((acc, feature) => {
    acc[feature.id.toUpperCase()] = feature.id;
    return acc;
}, {});

// Dynamically build MODULE_ACTIONS map from registered features
export const MODULE_ACTIONS = listFeatures().reduce((acc, feature) => {
    acc[feature.id] = feature.permissions?.actions || [];
    return acc;
}, {});
