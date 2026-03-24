export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'km'];
export const LANGUAGE_STORAGE_KEY = 'portfolio.language';

const safeString = (value) => (typeof value === 'string' ? value : '');

export const normalizeLanguage = (value) => (
    SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE
);

export const isLocalizedObject = (value) => (
    !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && ('en' in value || 'km' in value)
);

export const getLanguageValue = (field, lang = DEFAULT_LANGUAGE, fallbackToEnglish = true) => {
    if (isLocalizedObject(field)) {
        const localized = safeString(field?.[lang]).trim();
        if (localized) return localized;

        if (fallbackToEnglish && lang !== 'en') {
            return safeString(field?.en).trim();
        }
        return '';
    }

    if (typeof field === 'string') {
        return (lang === 'en' || fallbackToEnglish) ? field : '';
    }

    return '';
};

export const getLocalizedField = (field, lang = DEFAULT_LANGUAGE) => (
    getLanguageValue(field, lang, true)
);

export const toLocalizedField = (field, defaultEnglish = '') => {
    if (isLocalizedObject(field)) {
        const enValue = safeString(field.en).trim() || defaultEnglish;
        const kmValue = safeString(field.km).trim();
        return {
            en: enValue,
            km: kmValue
        };
    }

    if (typeof field === 'string') {
        const enValue = field.trim() || defaultEnglish;
        return {
            en: enValue,
            km: ''
        };
    }

    return {
        en: defaultEnglish,
        km: ''
    };
};

export const buildLocalizedFieldFromInput = (data, field, defaultEnglish = '') => {
    const raw = data?.[field];
    const inputEn = data?.[`${field}En`];
    const inputKm = data?.[`${field}Km`];

    const fallbackEn = isLocalizedObject(raw) ? raw.en : raw;
    const fallbackKm = isLocalizedObject(raw) ? raw.km : '';

    const en = safeString(inputEn ?? fallbackEn).trim() || defaultEnglish;
    const km = safeString(inputKm ?? fallbackKm).trim();

    return { en, km };
};

export const localizeEntityFields = (entity, fields = [], lang = DEFAULT_LANGUAGE) => {
    if (!entity || typeof entity !== 'object') return entity;

    const localized = { ...entity };
    fields.forEach((field) => {
        localized[field] = getLocalizedField(entity[field], lang);
    });
    return localized;
};

export const getLanguageFromStorage = () => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
};

export const buildMultilingualMigrationPatch = (data, fields = [], defaults = {}) => {
    if (!data || typeof data !== 'object') return {};

    return fields.reduce((patch, field) => {
        const value = data[field];
        const normalized = toLocalizedField(value, defaults[field] || '');

        if (!isLocalizedObject(value)) {
            patch[field] = normalized;
            return patch;
        }

        const enChanged = safeString(value.en).trim() !== normalized.en;
        const kmChanged = safeString(value.km).trim() !== normalized.km;
        if (enChanged || kmChanged) {
            patch[field] = normalized;
        }
        return patch;
    }, {});
};
