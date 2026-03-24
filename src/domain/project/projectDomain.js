import { slugify } from '../shared/slugify';
import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

/**
 * Normalizes project data for Firestore.
 * @param {Object} data - Raw form data
 * @returns {Object} Normalized data
 */
export const normalizeProject = (data) => {
    const rawTechStack = data.techStack
        ? (typeof data.techStack === 'string'
            ? data.techStack.split(',').map(t => t.trim()).filter(t => t)
            : data.techStack)
        : [];
    const techStack = [...new Set(rawTechStack)];
    const title = buildLocalizedFieldFromInput(data, 'title', 'Untitled Project');
    const description = buildLocalizedFieldFromInput(data, 'description');
    const content = buildLocalizedFieldFromInput(data, 'content');

    return {
        title,
        description,
        techStack,
        githubUrl: (data.githubUrl || '').trim(),
        liveUrl: (data.liveUrl || '').trim(),
        slug: slugify((data.slug || title.en || 'untitled').trim()),
        content,
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
    const title = getLocalizedField(data.title, 'en');
    
    if (!title || !title.trim()) {
        errors.titleEn = 'English title is required';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};
