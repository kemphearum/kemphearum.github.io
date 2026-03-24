import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
    const { t, language, setLanguage, toggleLanguage, languages } = useLanguage();

    return {
        t,
        language,
        lang: language,
        setLanguage,
        toggleLanguage,
        languages
    };
};

export default useTranslation;
