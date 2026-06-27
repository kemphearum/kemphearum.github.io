import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';
import { slugify } from '../shared/slugify';

/**
 * Normalizes certificate form data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeCertificate = (data) => {
    const name = buildLocalizedFieldFromInput(data, 'name');
    const description = buildLocalizedFieldFromInput(data, 'description');
    const nameEn = getLocalizedField(name, 'en');

    return {
        name,
        description,
        organization: (data.organization || '').trim(),
        issueDate: (data.issueDate || '').trim(),
        expiryDate: (data.expiryDate || '').trim(),
        credentialId: (data.credentialId || '').trim(),
        url: (data.url || '').trim(),
        slug: data.slug ? slugify(data.slug) : slugify(nameEn || ''),
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

/**
 * Validates certificate data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateCertificate = (data) => {
    const errors = {};
    const name = getLocalizedField(data.name, 'en');
    if (!name || !name.trim()) {
        errors.nameEn = 'English name is required';
    }
    if (!data.organization || !String(data.organization).trim()) {
        errors.organization = 'Issuing organization is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
