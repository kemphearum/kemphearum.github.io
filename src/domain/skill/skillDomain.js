import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';
import { slugify } from '../shared/slugify';

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

/**
 * Normalizes skill form data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeSkill = (data) => {
    const name = buildLocalizedFieldFromInput(data, 'name');
    const description = buildLocalizedFieldFromInput(data, 'description');
    const nameEn = getLocalizedField(name, 'en');

    return {
        name,
        description,
        category: (data.category || '').trim(),
        level: SKILL_LEVELS.includes(data.level) ? data.level : 'intermediate',
        slug: data.slug ? slugify(data.slug) : slugify(nameEn || ''),
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

/**
 * Validates skill data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateSkill = (data) => {
    const errors = {};
    const name = getLocalizedField(data.name, 'en');
    if (!name || !name.trim()) {
        errors.nameEn = 'English name is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
