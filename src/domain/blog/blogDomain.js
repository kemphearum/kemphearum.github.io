import { slugify } from '../shared/slugify';
import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

/**
 * Normalizes blog post data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizePost = (data) => {
    const rawTags = typeof data.tags === 'string'
        ? data.tags.split(',').map(t => t.trim()).filter(t => t)
        : (Array.isArray(data.tags) ? data.tags : []);
    const tags = [...new Set(rawTags)];
    const title = buildLocalizedFieldFromInput(data, 'title', 'Untitled Post');
    const excerpt = buildLocalizedFieldFromInput(data, 'excerpt');
    const content = buildLocalizedFieldFromInput(data, 'content');

    return {
        title,
        slug: slugify((data.slug || title.en || 'untitled').trim()),
        excerpt,
        content,
        tags,
        visible: data.visible !== false,
        featured: !!data.featured,
        ...(data.coverImage !== undefined && { coverImage: data.coverImage })
    };
};

/**
 * Validates blog post data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validatePost = (data) => {
    const errors = {};
    const title = getLocalizedField(data.title, 'en');
    const content = getLocalizedField(data.content, 'en');
    
    if (!title || !title.trim()) {
        errors.titleEn = 'English title is required';
    }

    if (!content || !content.trim()) {
        errors.contentEn = 'English content is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
