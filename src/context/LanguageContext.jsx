import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en.json';
import km from '../i18n/km.json';
import {
    DEFAULT_LANGUAGE,
    LANGUAGE_STORAGE_KEY,
    SUPPORTED_LANGUAGES,
    getLanguageFromStorage,
    normalizeLanguage
} from '../utils/localization';

const translations = { en, km };
const LanguageContext = createContext(null);

const getNestedValue = (obj, key) => key
    .split('.')
    .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);

const interpolate = (text, params = {}) => text.replace(/\{\{(\w+)\}\}/g, (_, token) => (
    params[token] !== undefined ? String(params[token]) : `{{${token}}}`
));

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(getLanguageFromStorage);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((nextLanguage) => {
        const normalized = normalizeLanguage(nextLanguage);
        setLanguageState(normalized);
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguageState((prev) => (prev === 'en' ? 'km' : 'en'));
    }, []);

    const t = useCallback((key, params = {}) => {
        const activeDictionary = translations[language] || translations[DEFAULT_LANGUAGE];
        const englishDictionary = translations[DEFAULT_LANGUAGE];
        const localized = getNestedValue(activeDictionary, key);
        const fallback = getNestedValue(englishDictionary, key);
        const value = (localized ?? fallback ?? key);

        if (typeof value !== 'string') return key;
        return interpolate(value, params);
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        toggleLanguage,
        t,
        languages: SUPPORTED_LANGUAGES
    }), [language, setLanguage, toggleLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
