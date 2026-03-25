import { normalizeRole } from '../../utils/permissions';

/**
 * Normalizes user data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeUser = (data) => {
    const normalizedRole = normalizeRole(data.role || 'pending') || 'pending';
    return {
        email: (data.email || '').toLowerCase().trim(),
        role: normalizedRole,
        isActive: data.isActive !== false,
        displayName: (data.displayName || '').trim()
    };
};

/**
 * Validates user data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateUser = (data) => {
    const errors = {};
    
    if (!data.email || !data.email.trim()) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Invalid email format';
    }

    if (!data.role) {
        errors.role = 'Role is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
