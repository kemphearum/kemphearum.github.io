import { slugify } from '../shared/slugify';

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

    return {
        title: (data.title || 'Untitled Post').trim(),
        slug: slugify((data.slug || data.title || 'untitled').trim()),
        excerpt: (data.excerpt || '').trim(),
        content: (data.content || '').trim(),
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
    
    if (!data.title || !data.title.trim()) {
        errors.title = 'Title is required';
    }

    if (!data.content || !data.content.trim()) {
        errors.content = 'Content is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
