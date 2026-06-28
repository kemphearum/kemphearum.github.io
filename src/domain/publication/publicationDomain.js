import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const normalizePublication = (data) => {
    const title = buildLocalizedFieldFromInput(data, 'title');
    const publisher = buildLocalizedFieldFromInput(data, 'publisher');
    const description = buildLocalizedFieldFromInput(data, 'description');

    return {
        title,
        publisher,
        description,
        publishDate: (data.publishDate || '').trim(),
        link: (data.link || '').trim(),
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

export const validatePublication = (data) => {
    const errors = {};
    const titleEn = getLocalizedField(data.title, 'en');
    if (!titleEn || !titleEn.trim()) {
        errors.titleEn = 'English Title is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
