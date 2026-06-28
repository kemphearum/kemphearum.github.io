import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const normalizeAward = (data) => {
    const title = buildLocalizedFieldFromInput(data, 'title');
    const organization = buildLocalizedFieldFromInput(data, 'organization');
    const description = buildLocalizedFieldFromInput(data, 'description');

    return {
        title,
        organization,
        description,
        issueDate: (data.issueDate || '').trim(),
        link: (data.link || '').trim(),
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

export const validateAward = (data) => {
    const errors = {};
    const titleEn = getLocalizedField(data.title, 'en');
    if (!titleEn || !titleEn.trim()) {
        errors.titleEn = 'English Title is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
