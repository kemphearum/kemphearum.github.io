import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const normalizeTestimonial = (data) => {
    const authorName = (data.authorName || '').trim();
    const authorRole = buildLocalizedFieldFromInput(data, 'authorRole');
    const authorCompany = (data.authorCompany || '').trim();
    const content = buildLocalizedFieldFromInput(data, 'content');

    return {
        authorName,
        authorRole,
        authorCompany,
        content,
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

export const validateTestimonial = (data) => {
    const errors = {};
    if (!data.authorName || !data.authorName.trim()) {
        errors.authorName = 'Author Name is required';
    }
    const content = getLocalizedField(data.content, 'en');
    if (!content || !content.trim()) {
        errors.contentEn = 'English Content is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
