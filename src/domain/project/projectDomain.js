import { slugify } from '../shared/slugify';

/**
 * Normalizes project data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeProject = (data) => {
    const techStack = data.techStack
        ? (typeof data.techStack === 'string'
            ? data.techStack.split(',').map(t => t.trim()).filter(t => t)
            : data.techStack)
        : [];

    return {
        title: (data.title || 'Untitled Project').trim(),
        description: (data.description || '').trim(),
        techStack,
        githubUrl: (data.githubUrl || '').trim(),
        liveUrl: (data.liveUrl || '').trim(),
        slug: data.slug || slugify(data.title || 'untitled'),
        content: (data.content || '').trim(),
        visible: data.visible !== false,
        featured: !!data.featured,
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl })
    };
};

/**
 * Validates project data.
 * @param {Object} data - Normalized or raw data
 * @returns {Object|null} Error object { field: message } or null
 */
export const validateProject = (data) => {
    const errors = {};
    
    if (!data.title || !data.title.trim()) {
        errors.title = 'Title is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
