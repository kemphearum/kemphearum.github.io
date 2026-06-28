import { buildLocalizedFieldFromInput, getLocalizedField } from '../../utils/localization';

export const normalizeSpeaking = (data) => {
    const title = buildLocalizedFieldFromInput(data, 'title');
    const eventName = buildLocalizedFieldFromInput(data, 'eventName');
    const location = buildLocalizedFieldFromInput(data, 'location');
    const description = buildLocalizedFieldFromInput(data, 'description');

    return {
        title,
        eventName,
        location,
        description,
        date: (data.date || '').trim(),
        link: (data.link || '').trim(),
        visible: data.visible !== false,
        featured: !!data.featured,
        order: Number(data.order) || 0
    };
};

export const validateSpeaking = (data) => {
    const errors = {};
    const titleEn = getLocalizedField(data.title, 'en');
    if (!titleEn || !titleEn.trim()) {
        errors.titleEn = 'English Title is required';
    }
    return Object.keys(errors).length > 0 ? errors : null;
};
