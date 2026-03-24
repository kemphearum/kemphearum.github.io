import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './LanguageSwitcher.module.scss';

const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useTranslation();

    return (
        <div className={styles.switcher} role="group" aria-label={t('language.label')}>
            <button
                type="button"
                className={`${styles.option} ${language === 'en' ? styles.active : ''}`}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
            >
                {t('language.en')}
            </button>
            <button
                type="button"
                className={`${styles.option} ${language === 'km' ? styles.active : ''}`}
                onClick={() => setLanguage('km')}
                aria-pressed={language === 'km'}
            >
                {t('language.km')}
            </button>
        </div>
    );
};

export default LanguageSwitcher;
